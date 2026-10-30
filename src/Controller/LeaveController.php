<?php

namespace App\Controller;

use App\Entity\Leave;
use App\Repository\LeaveRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

/**
 * LeaveController — Leave & Absence Management
 *
 * Leave types: Congé Annuel | Maladie | Télétravail | Exceptionnel
 * Statuses:    En attente | Approuvé | Refusé
 *
 * Roles:
 *   - EMPLOYEE        → create own leaves, see own history
 *   - DEPT_MANAGER / INTERIM → see dept leaves, approve/reject
 *   - HR_AGENT        → see all, update
 *   - HR_MANAGER      → full access
 *
 * Maps to React page: src/pages/LeaveManagement.jsx
 */
#[Route('/api/leaves', name: 'api_leaves_')]
class LeaveController extends AbstractController
{
    public function __construct(
        private LeaveRepository $repo,
        private EntityManagerInterface $em
    ) {}

    // ─── LIST ─────────────────────────────────────────────────────────────────

    #[Route('', name: 'list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_USER');

        $user    = $this->getUser();
        $roles   = $user->getRoles();
        $status  = $request->query->get('status');   // En attente | Approuvé | Refusé
        $type    = $request->query->get('type');      // Congé Annuel | Maladie | etc.
        $page    = max(1, (int) $request->query->get('page', 1));
        $perPage = 10;

        if (in_array('ROLE_EMPLOYEE', $roles)) {
            $leaves = $this->repo->findByEmployee($user->getId(), $status, $type);
        } elseif (in_array('ROLE_DEPARTMENT_MANAGER', $roles) || in_array('ROLE_INTERIM_MANAGER', $roles)) {
            $leaves = $this->repo->findByDepartment($user->getDepartment(), $status, $type);
        } else {
            $leaves = $this->repo->findAllFiltered($status, $type);
        }

        $total = count($leaves);
        $paged = array_slice($leaves, ($page - 1) * $perPage, $perPage);

        // Pending approvals for managers (requests from others, not themselves)
        $pendingForApproval = [];
        if (!in_array('ROLE_EMPLOYEE', $roles)) {
            $allPending = $this->repo->findPendingExcluding($user->getId());
            $pendingForApproval = in_array('ROLE_DEPARTMENT_MANAGER', $roles) || in_array('ROLE_INTERIM_MANAGER', $roles)
                ? array_filter($allPending, fn($l) => strtolower($l->getDepartment()) === strtolower($user->getDepartment()))
                : $allPending;
        }

        return $this->json([
            'data'              => array_values($paged),
            'total'             => $total,
            'page'              => $page,
            'perPage'           => $perPage,
            'totalPages'        => ceil($total / $perPage),
            'pendingApprovals'  => count($pendingForApproval),
        ], 200, [], ['groups' => ['leave:read']]);
    }

    // ─── SHOW ─────────────────────────────────────────────────────────────────

    #[Route('/{id}', name: 'show', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function show(int $id): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_USER');

        $leave = $this->repo->find($id);
        if (!$leave) {
            return $this->json(['error' => 'Leave not found'], 404);
        }

        return $this->json($leave, 200, [], ['groups' => ['leave:read', 'leave:detail']]);
    }

    // ─── CREATE ───────────────────────────────────────────────────────────────

    #[Route('', name: 'create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_USER');

        $user = $this->getUser();
        $data = json_decode($request->getContent(), true);

        if (empty($data['type']) || empty($data['start']) || empty($data['end'])) {
            return $this->json(['error' => 'type, start and end are required'], 400);
        }

        $start = new \DateTimeImmutable($data['start']);
        $end   = new \DateTimeImmutable($data['end']);

        if ($end < $start) {
            return $this->json(['error' => 'End date must be after start date'], 400);
        }

        $days = (int) $start->diff($end)->days + 1;

        $leave = new Leave();
        $leave->setEmployee($user);
        $leave->setName($user->getFullName());
        $leave->setDepartment($user->getDepartment());
        $leave->setType($data['type']);
        $leave->setStartDate($start);
        $leave->setEndDate($end);
        $leave->setDuration("{$days} jour" . ($days > 1 ? 's' : ''));
        $leave->setMotif($data['motif'] ?? null);
        $leave->setStatus('En attente');
        $leave->setCreatedAt(new \DateTimeImmutable());

        $this->em->persist($leave);
        $this->em->flush();

        return $this->json($leave, 201, [], ['groups' => ['leave:read']]);
    }

    // ─── APPROVE / REJECT ─────────────────────────────────────────────────────

    #[Route('/{id}/approve', name: 'approve', methods: ['PATCH'], requirements: ['id' => '\d+'])]
    public function approve(int $id): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_DEPARTMENT_MANAGER'); // Also matches HR roles

        $leave = $this->repo->find($id);
        if (!$leave) {
            return $this->json(['error' => 'Leave not found'], 404);
        }

        $leave->setStatus('Approuvé');
        $leave->setApprovedBy($this->getUser()->getFullName());
        $leave->setUpdatedAt(new \DateTimeImmutable());
        $this->em->flush();

        return $this->json($leave, 200, [], ['groups' => ['leave:read']]);
    }

    #[Route('/{id}/reject', name: 'reject', methods: ['PATCH'], requirements: ['id' => '\d+'])]
    public function reject(int $id, Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_DEPARTMENT_MANAGER');

        $leave = $this->repo->find($id);
        if (!$leave) {
            return $this->json(['error' => 'Leave not found'], 404);
        }

        $data = json_decode($request->getContent(), true);

        $leave->setStatus('Refusé');
        $leave->setRejectionReason($data['reason'] ?? null);
        $leave->setUpdatedAt(new \DateTimeImmutable());
        $this->em->flush();

        return $this->json($leave, 200, [], ['groups' => ['leave:read']]);
    }

    // ─── UPDATE ───────────────────────────────────────────────────────────────

    #[Route('/{id}', name: 'update', methods: ['PUT', 'PATCH'], requirements: ['id' => '\d+'])]
    public function update(int $id, Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_HR_AGENT');

        $leave = $this->repo->find($id);
        if (!$leave) {
            return $this->json(['error' => 'Leave not found'], 404);
        }

        $data = json_decode($request->getContent(), true);

        if (isset($data['type']))   $leave->setType($data['type']);
        if (isset($data['motif']))  $leave->setMotif($data['motif']);
        if (isset($data['status'])) $leave->setStatus($data['status']);
        if (isset($data['start'])) {
            $leave->setStartDate(new \DateTimeImmutable($data['start']));
        }
        if (isset($data['end'])) {
            $leave->setEndDate(new \DateTimeImmutable($data['end']));
        }

        $leave->setUpdatedAt(new \DateTimeImmutable());
        $this->em->flush();

        return $this->json($leave, 200, [], ['groups' => ['leave:read']]);
    }

    // ─── DELETE ───────────────────────────────────────────────────────────────

    #[Route('/{id}', name: 'delete', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    public function delete(int $id): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_HR_AGENT');

        $leave = $this->repo->find($id);
        if (!$leave) {
            return $this->json(['error' => 'Leave not found'], 404);
        }

        $this->em->remove($leave);
        $this->em->flush();

        return $this->json(['message' => 'Leave deleted'], 200);
    }
}
