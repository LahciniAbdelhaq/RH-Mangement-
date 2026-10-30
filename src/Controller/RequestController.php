<?php

namespace App\Controller;

use App\Entity\HrRequest;
use App\Repository\HrRequestRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

/**
 * RequestController — HR Document Requests workflow
 *
 * Statuses: attente | cours | terminees | rejetees
 * Roles:
 *   - EMPLOYEE        → sees only their own requests, can create
 *   - DEPARTMENT_MANAGER / INTERIM_MANAGER → sees dept requests, can validate
 *   - HR_AGENT        → sees all, can process/update
 *   - HR_MANAGER      → full access
 *
 * Maps to React page: src/pages/Requests.jsx
 */
#[Route('/api/requests', name: 'api_requests_')]
class RequestController extends AbstractController
{
    public function __construct(
        private HrRequestRepository $repo,
        private EntityManagerInterface $em
    ) {}

    // ─── LIST ─────────────────────────────────────────────────────────────────

    #[Route('', name: 'list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_USER');

        $user        = $this->getUser();
        $roles       = $user->getRoles();
        $status      = $request->query->get('status');       // attente|cours|terminees|rejetees
        $page        = max(1, (int) $request->query->get('page', 1));
        $perPage     = 10;

        // Role-scoped filtering
        if (in_array('ROLE_EMPLOYEE', $roles)) {
            $requests = $this->repo->findByOwner($user->getId(), $status);
        } elseif (in_array('ROLE_DEPARTMENT_MANAGER', $roles) || in_array('ROLE_INTERIM_MANAGER', $roles)) {
            $requests = $this->repo->findByDepartment($user->getDepartment(), $status);
        } else {
            // HR_AGENT and HR_MANAGER see everything
            $requests = $this->repo->findAllFiltered($status);
        }

        // Pagination
        $total  = count($requests);
        $paged  = array_slice($requests, ($page - 1) * $perPage, $perPage);

        return $this->json([
            'data'       => $paged,
            'total'      => $total,
            'page'       => $page,
            'perPage'    => $perPage,
            'totalPages' => ceil($total / $perPage),
            'counts'     => [
                'attente'   => $this->repo->countByStatus('attente'),
                'cours'     => $this->repo->countByStatus('cours'),
                'terminees' => $this->repo->countByStatus('terminees'),
                'rejetees'  => $this->repo->countByStatus('rejetees'),
            ],
        ], 200, [], ['groups' => ['request:read']]);
    }

    // ─── SHOW ─────────────────────────────────────────────────────────────────

    #[Route('/{id}', name: 'show', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function show(int $id): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_USER');

        $hrRequest = $this->repo->find($id);
        if (!$hrRequest) {
            return $this->json(['error' => 'Request not found'], 404);
        }

        $this->assertCanAccess($hrRequest);

        return $this->json($hrRequest, 200, [], ['groups' => ['request:read', 'request:detail']]);
    }

    // ─── CREATE ───────────────────────────────────────────────────────────────

    #[Route('', name: 'create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_USER');

        $user = $this->getUser();
        $data = json_decode($request->getContent(), true);

        if (empty($data['type'])) {
            return $this->json(['error' => 'Request type is required'], 400);
        }

        $hrRequest = new HrRequest();
        $hrRequest->setTitle($data['type']);
        $hrRequest->setSub($data['sub'] ?? null);
        $hrRequest->setDescription($data['description'] ?? null);
        $hrRequest->setPriority($data['priorite'] ?? 'Normale');
        $hrRequest->setStatus('attente');
        $hrRequest->setOwner($user->getFullName());
        $hrRequest->setOwnerUser($user);
        $hrRequest->setDepartment($user->getDepartment());
        $hrRequest->setCreatedAt(new \DateTimeImmutable());

        $this->em->persist($hrRequest);
        $this->em->flush();

        return $this->json($hrRequest, 201, [], ['groups' => ['request:read']]);
    }

    // ─── UPDATE STATUS (approve / reject / process) ───────────────────────────

    #[Route('/{id}/status', name: 'update_status', methods: ['PATCH'], requirements: ['id' => '\d+'])]
    public function updateStatus(int $id, Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_USER');

        $hrRequest = $this->repo->find($id);
        if (!$hrRequest) {
            return $this->json(['error' => 'Request not found'], 404);
        }

        $data   = json_decode($request->getContent(), true);
        $status = $data['status'] ?? null;

        $allowed = ['attente', 'cours', 'terminees', 'rejetees'];
        if (!in_array($status, $allowed)) {
            return $this->json(['error' => "Invalid status. Allowed: " . implode(', ', $allowed)], 400);
        }

        $roles = $this->getUser()->getRoles();

        // EMPLOYEE cannot change status
        if (in_array('ROLE_EMPLOYEE', $roles)) {
            return $this->json(['error' => 'Employees cannot change request status'], 403);
        }

        // DEPT_MANAGER can only validate (attente → cours) or reject
        if (in_array('ROLE_DEPARTMENT_MANAGER', $roles) || in_array('ROLE_INTERIM_MANAGER', $roles)) {
            if (!in_array($status, ['cours', 'rejetees'])) {
                return $this->json(['error' => 'Department managers can only set status to cours or rejetees'], 403);
            }
        }

        $hrRequest->setStatus($status);
        $hrRequest->setUpdatedAt(new \DateTimeImmutable());
        if (isset($data['note'])) {
            $hrRequest->setNote($data['note']);
        }

        $this->em->flush();

        return $this->json($hrRequest, 200, [], ['groups' => ['request:read']]);
    }

    // ─── DELETE ───────────────────────────────────────────────────────────────

    #[Route('/{id}', name: 'delete', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    public function delete(int $id): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_HR_AGENT');

        $hrRequest = $this->repo->find($id);
        if (!$hrRequest) {
            return $this->json(['error' => 'Request not found'], 404);
        }

        $this->em->remove($hrRequest);
        $this->em->flush();

        return $this->json(['message' => 'Request deleted'], 200);
    }

    // ─── SHARE LINK (public document verification) ────────────────────────────

    #[Route('/share/{docId}', name: 'share', methods: ['GET'])]
    public function share(string $docId): JsonResponse
    {
        // Public endpoint — no auth required
        $hrRequest = $this->repo->findByShareToken($docId);
        if (!$hrRequest) {
            return $this->json(['error' => 'Document not found or link expired'], 404);
        }

        return $this->json([
            'title'     => $hrRequest->getTitle(),
            'owner'     => $hrRequest->getOwner(),
            'status'    => $hrRequest->getStatus(),
            'issuedAt'  => $hrRequest->getCreatedAt(),
            'verified'  => true,
        ], 200);
    }

    // ─── PRIVATE HELPER ───────────────────────────────────────────────────────

    private function assertCanAccess(HrRequest $hrRequest): void
    {
        $user  = $this->getUser();
        $roles = $user->getRoles();

        if (in_array('ROLE_HR_MANAGER', $roles) || in_array('ROLE_HR_AGENT', $roles)) {
            return; // Full access
        }

        if (in_array('ROLE_DEPARTMENT_MANAGER', $roles) || in_array('ROLE_INTERIM_MANAGER', $roles)) {
            if (strtolower($hrRequest->getDepartment()) !== strtolower($user->getDepartment())) {
                throw $this->createAccessDeniedException('Access denied to this department\'s request.');
            }
            return;
        }

        // EMPLOYEE — own only
        if ($hrRequest->getOwnerUser()?->getId() !== $user->getId()) {
            throw $this->createAccessDeniedException('You can only view your own requests.');
        }
    }
}
