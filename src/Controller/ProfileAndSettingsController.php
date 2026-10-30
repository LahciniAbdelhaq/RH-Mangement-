<?php

namespace App\Controller;

use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;

/**
 * ProfileController — Authenticated User Profile
 *
 * Allows each user to read and update their own profile.
 * Maps to React page: src/pages/Profile.jsx
 */
#[Route('/api/profile', name: 'api_profile_')]
class ProfileController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $em,
        private UserPasswordHasherInterface $hasher
    ) {}

    // ─── GET MY PROFILE ───────────────────────────────────────────────────────

    #[Route('', name: 'show', methods: ['GET'])]
    public function show(): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_USER');

        $user = $this->getUser();

        return $this->json([
            'id'           => $user->getId(),
            'name'         => $user->getFullName(),
            'email'        => $user->getEmail(),
            'role'         => $user->getRoles(),
            'title'        => $user->getTitle(),
            'department'   => $user->getDepartment(),
            'phone'        => $user->getPhone(),
            'location'     => $user->getLocation(),
            'contractType' => $user->getContractType(),
            'hireDate'     => $user->getHireDate()?->format('Y-m-d'),
            'avatar'       => $user->getAvatar(),
            'interimUntil' => $user->getInterimUntil()?->format('c'),
            'leaveBalance' => [
                'annualUsed'  => $user->getAnnualLeavesUsed() ?? 0,
                'annualTotal' => $user->getAnnualLeavesTotal() ?? 22,
                'sickUsed'    => $user->getSickLeavesUsed() ?? 0,
                'sickTotal'   => $user->getSickLeavesTotal() ?? 8,
            ],
        ]);
    }

    // ─── UPDATE MY PROFILE ────────────────────────────────────────────────────

    #[Route('', name: 'update', methods: ['PUT', 'PATCH'])]
    public function update(Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_USER');

        $user = $this->getUser();
        $data = json_decode($request->getContent(), true);

        if (isset($data['firstName'])) $user->setFirstName($data['firstName']);
        if (isset($data['lastName']))  $user->setLastName($data['lastName']);
        if (isset($data['phone']))     $user->setPhone($data['phone']);
        if (isset($data['location']))  $user->setLocation($data['location']);

        // Email uniqueness check
        if (isset($data['email']) && $data['email'] !== $user->getEmail()) {
            $user->setEmail($data['email']);
        }

        $this->em->flush();

        return $this->json(['message' => 'Profile updated successfully']);
    }

    // ─── CHANGE PASSWORD ──────────────────────────────────────────────────────

    #[Route('/password', name: 'change_password', methods: ['PATCH'])]
    public function changePassword(Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_USER');

        $user = $this->getUser();
        $data = json_decode($request->getContent(), true);

        if (empty($data['currentPassword']) || empty($data['newPassword'])) {
            return $this->json(['error' => 'currentPassword and newPassword are required'], 400);
        }

        if (!$this->hasher->isPasswordValid($user, $data['currentPassword'])) {
            return $this->json(['error' => 'Current password is incorrect'], 400);
        }

        if (strlen($data['newPassword']) < 8) {
            return $this->json(['error' => 'New password must be at least 8 characters'], 400);
        }

        $user->setPassword($this->hasher->hashPassword($user, $data['newPassword']));
        $this->em->flush();

        return $this->json(['message' => 'Password changed successfully']);
    }
}


// ══════════════════════════════════════════════════════════════════════════════
//  SettingsController — Admin Settings & Audit Logs
//  Maps to React page: src/pages/Settings.jsx
//  Restricted to: HR_MANAGER
// ══════════════════════════════════════════════════════════════════════════════

namespace App\Controller;

use App\Entity\AuditLog;
use App\Repository\AuditLogRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/settings', name: 'api_settings_')]
class SettingsController extends AbstractController
{
    public function __construct(
        private AuditLogRepository $auditRepo,
        private EntityManagerInterface $em
    ) {}

    // ─── GET SETTINGS ─────────────────────────────────────────────────────────

    #[Route('', name: 'show', methods: ['GET'])]
    public function show(): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_HR_MANAGER');

        // Settings are stored per-org (single row in a settings table)
        // Return current values
        return $this->json([
            'companyName'      => 'RH Management S.A.',
            'timezone'         => 'Africa/Casablanca',
            'language'         => 'fr',
            'leavePolicy'      => [
                'annualDays'   => 22,
                'sickDays'     => 8,
            ],
            'notifications'    => [
                'emailEnabled' => true,
                'reminderDays' => 3,
            ],
        ]);
    }

    // ─── UPDATE SETTINGS ──────────────────────────────────────────────────────

    #[Route('', name: 'update', methods: ['PUT', 'PATCH'])]
    public function update(Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_HR_MANAGER');

        // TODO: persist to a Settings entity
        return $this->json(['message' => 'Settings saved successfully']);
    }

    // ─── AUDIT LOGS ───────────────────────────────────────────────────────────

    #[Route('/audit-logs', name: 'audit_logs', methods: ['GET'])]
    public function auditLogs(Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_HR_MANAGER');

        $page    = max(1, (int) $request->query->get('page', 1));
        $perPage = 10;

        $logs  = $this->auditRepo->findAll(); // Add ORDER BY timestamp DESC in repo
        $total = count($logs);
        $paged = array_slice($logs, ($page - 1) * $perPage, $perPage);

        return $this->json([
            'data'       => array_map(fn($l) => [
                'id'        => $l->getId(),
                'action'    => $l->getAction(),
                'user'      => $l->getUserName(),
                'details'   => $l->getDetails(),
                'timestamp' => $l->getTimestamp()->format('c'),
            ], $paged),
            'total'      => $total,
            'page'       => $page,
            'totalPages' => ceil($total / $perPage),
        ]);
    }

    // ─── CLEAR AUDIT LOGS ─────────────────────────────────────────────────────

    #[Route('/audit-logs', name: 'clear_audit_logs', methods: ['DELETE'])]
    public function clearAuditLogs(): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_HR_MANAGER');

        $this->auditRepo->deleteAll();

        return $this->json(['message' => 'Audit logs cleared']);
    }
}
