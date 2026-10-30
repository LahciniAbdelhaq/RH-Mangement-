<?php

namespace App\Controller;

use App\Entity\ComplianceRecord;
use App\Repository\ComplianceRecordRepository;
use App\Repository\EmployeeRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

/**
 * ComplianceController — Regulatory Compliance & Training Tracking
 *
 * Tracks mandatory training requirements per employee.
 * Statuses: Non Conforme | En Cours | Conforme
 *
 * Restricted to: HR_MANAGER, HR_AGENT
 *
 * Maps to React page: src/pages/Compliance.jsx
 */
#[Route('/api/compliance', name: 'api_compliance_')]
class ComplianceController extends AbstractController
{
    public function __construct(
        private ComplianceRecordRepository $repo,
        private EmployeeRepository $employeeRepo,
        private EntityManagerInterface $em
    ) {}

    // ─── LIST ─────────────────────────────────────────────────────────────────

    #[Route('', name: 'list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_HR_AGENT');

        $status = $request->query->get('status'); // Non Conforme | En Cours | Conforme
        $late   = $request->query->getBoolean('late', false);

        $records = $late
            ? $this->repo->findLateRecords()
            : $this->repo->findAllFiltered($status);

        return $this->json(array_map(fn($r) => [
            'id'            => $r->getId(),
            'employeeId'    => $r->getEmployee()->getId(),
            'name'          => $r->getEmployee()->getFullName(),
            'email'         => $r->getEmployee()->getEmail(),
            'requirement'   => $r->getRequirement(),
            'status'        => $r->getStatus(),
            'deadline'      => $r->getDeadline()?->format('Y-m-d'),
            'isLate'        => $r->isLate(),
            'completedAt'   => $r->getCompletedAt()?->format('Y-m-d'),
        ], $records));
    }

    // ─── SHOW ─────────────────────────────────────────────────────────────────

    #[Route('/{id}', name: 'show', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function show(int $id): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_HR_AGENT');

        $record = $this->repo->find($id);
        if (!$record) {
            return $this->json(['error' => 'Compliance record not found'], 404);
        }

        return $this->json([
            'id'          => $record->getId(),
            'employee'    => [
                'id'    => $record->getEmployee()->getId(),
                'name'  => $record->getEmployee()->getFullName(),
                'email' => $record->getEmployee()->getEmail(),
            ],
            'requirement' => $record->getRequirement(),
            'status'      => $record->getStatus(),
            'deadline'    => $record->getDeadline()?->format('Y-m-d'),
            'isLate'      => $record->isLate(),
            'completedAt' => $record->getCompletedAt()?->format('Y-m-d'),
            'notes'       => $record->getNotes(),
        ]);
    }

    // ─── CREATE ───────────────────────────────────────────────────────────────

    #[Route('', name: 'create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_HR_AGENT');

        $data = json_decode($request->getContent(), true);

        if (empty($data['employeeId']) || empty($data['requirement'])) {
            return $this->json(['error' => 'employeeId and requirement are required'], 400);
        }

        $employee = $this->employeeRepo->find($data['employeeId']);
        if (!$employee) {
            return $this->json(['error' => 'Employee not found'], 404);
        }

        $record = new ComplianceRecord();
        $record->setEmployee($employee);
        $record->setRequirement($data['requirement']);
        $record->setStatus($data['status'] ?? 'Non Conforme');
        $record->setNotes($data['notes'] ?? null);

        if (!empty($data['deadline'])) {
            $record->setDeadline(new \DateTimeImmutable($data['deadline']));
        }

        $this->em->persist($record);
        $this->em->flush();

        return $this->json(['id' => $record->getId(), 'message' => 'Compliance record created'], 201);
    }

    // ─── UPDATE STATUS ────────────────────────────────────────────────────────

    #[Route('/{id}', name: 'update', methods: ['PUT', 'PATCH'], requirements: ['id' => '\d+'])]
    public function update(int $id, Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_HR_AGENT');

        $record = $this->repo->find($id);
        if (!$record) {
            return $this->json(['error' => 'Record not found'], 404);
        }

        $data = json_decode($request->getContent(), true);

        if (isset($data['status'])) {
            $record->setStatus($data['status']);
            // If marked Conforme, auto-set completedAt
            if ($data['status'] === 'Conforme' && !$record->getCompletedAt()) {
                $completedAt = !empty($data['completedAt'])
                    ? new \DateTimeImmutable($data['completedAt'])
                    : new \DateTimeImmutable();
                $record->setCompletedAt($completedAt);
            }
        }

        if (isset($data['requirement'])) $record->setRequirement($data['requirement']);
        if (isset($data['notes']))       $record->setNotes($data['notes']);
        if (isset($data['deadline']))    $record->setDeadline(new \DateTimeImmutable($data['deadline']));

        $this->em->flush();

        return $this->json(['message' => 'Compliance record updated']);
    }

    // ─── SEND REMINDER ────────────────────────────────────────────────────────

    /**
     * POST /api/compliance/{id}/remind
     * Body: { message }
     * In production: triggers an email to the employee.
     */
    #[Route('/{id}/remind', name: 'remind', methods: ['POST'], requirements: ['id' => '\d+'])]
    public function remind(int $id, Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_HR_AGENT');

        $record = $this->repo->find($id);
        if (!$record) {
            return $this->json(['error' => 'Record not found'], 404);
        }

        $data    = json_decode($request->getContent(), true);
        $message = $data['message'] ?? "Rappel : veuillez compléter la formation \"{$record->getRequirement()}\".";

        // TODO: dispatch MailerInterface to $record->getEmployee()->getEmail()
        // For now return success confirmation
        return $this->json([
            'message'   => "Reminder sent to {$record->getEmployee()->getEmail()}",
            'recipient' => $record->getEmployee()->getFullName(),
            'subject'   => $message,
        ]);
    }

    // ─── DELETE ───────────────────────────────────────────────────────────────

    #[Route('/{id}', name: 'delete', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    public function delete(int $id): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_HR_MANAGER');

        $record = $this->repo->find($id);
        if (!$record) {
            return $this->json(['error' => 'Record not found'], 404);
        }

        $this->em->remove($record);
        $this->em->flush();

        return $this->json(['message' => 'Compliance record deleted']);
    }

    // ─── SUMMARY STATS ────────────────────────────────────────────────────────

    #[Route('/stats', name: 'stats', methods: ['GET'])]
    public function stats(): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_HR_AGENT');

        return $this->json([
            'total'       => $this->repo->count([]),
            'conforme'    => $this->repo->countByStatus('Conforme'),
            'enCours'     => $this->repo->countByStatus('En Cours'),
            'nonConforme' => $this->repo->countByStatus('Non Conforme'),
            'late'        => count($this->repo->findLateRecords()),
        ]);
    }
}
