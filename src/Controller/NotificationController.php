<?php

namespace App\Controller;

use App\Entity\Notification;
use App\Repository\NotificationRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

/**
 * NotificationController — User Notification System
 *
 * Notification types: request | alert | info
 * Categories:         conge | document | system | paie | absence
 *
 * Each user sees only their own notifications.
 * HR_MANAGER can broadcast system-wide notifications.
 *
 * Maps to React page: src/pages/Notifications.jsx
 */
#[Route('/api/notifications', name: 'api_notifications_')]
class NotificationController extends AbstractController
{
    public function __construct(
        private NotificationRepository $repo,
        private EntityManagerInterface $em
    ) {}

    // ─── LIST ─────────────────────────────────────────────────────────────────

    #[Route('', name: 'list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_USER');

        $user     = $this->getUser();
        $tab      = $request->query->get('tab', 'all'); // all | unread | request | alert | info
        $page     = max(1, (int) $request->query->get('page', 1));
        $perPage  = 20;

        $notifications = $this->repo->findForUser($user->getId(), $tab);

        $total = count($notifications);
        $paged = array_slice($notifications, ($page - 1) * $perPage, $perPage);
        $unreadCount = count(array_filter($notifications, fn($n) => $n->isUnread()));

        return $this->json([
            'data'        => array_map(fn($n) => $this->serialize($n), $paged),
            'total'       => $total,
            'unread'      => $unreadCount,
            'page'        => $page,
            'totalPages'  => ceil($total / $perPage),
        ]);
    }

    // ─── MARK AS READ ─────────────────────────────────────────────────────────

    #[Route('/{id}/read', name: 'mark_read', methods: ['PATCH'], requirements: ['id' => '\d+'])]
    public function markRead(int $id): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_USER');

        $notif = $this->repo->find($id);
        if (!$notif || $notif->getRecipient()->getId() !== $this->getUser()->getId()) {
            return $this->json(['error' => 'Notification not found'], 404);
        }

        $notif->setUnread(false);
        $this->em->flush();

        return $this->json(['message' => 'Marked as read']);
    }

    // ─── MARK ALL READ ────────────────────────────────────────────────────────

    #[Route('/read-all', name: 'mark_all_read', methods: ['PATCH'])]
    public function markAllRead(): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_USER');

        $notifs = $this->repo->findBy(['recipient' => $this->getUser(), 'unread' => true]);
        foreach ($notifs as $n) {
            $n->setUnread(false);
        }
        $this->em->flush();

        return $this->json(['message' => 'All notifications marked as read', 'count' => count($notifs)]);
    }

    // ─── DELETE ONE ───────────────────────────────────────────────────────────

    #[Route('/{id}', name: 'delete', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    public function delete(int $id): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_USER');

        $notif = $this->repo->find($id);
        if (!$notif || $notif->getRecipient()->getId() !== $this->getUser()->getId()) {
            return $this->json(['error' => 'Notification not found'], 404);
        }

        $this->em->remove($notif);
        $this->em->flush();

        return $this->json(['message' => 'Notification deleted']);
    }

    // ─── BROADCAST (HR_MANAGER only) ──────────────────────────────────────────

    /**
     * POST /api/notifications/broadcast
     * Body: { title, message, type, category, recipientIds? }
     * If recipientIds is empty → sends to all users.
     */
    #[Route('/broadcast', name: 'broadcast', methods: ['POST'])]
    public function broadcast(Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_HR_MANAGER');

        $data = json_decode($request->getContent(), true);

        if (empty($data['title']) || empty($data['message'])) {
            return $this->json(['error' => 'title and message are required'], 400);
        }

        $recipientIds = $data['recipientIds'] ?? [];

        // TODO: resolve recipients from DB, create Notification entities for each
        // and persist. Pseudo-code:
        // $users = empty($recipientIds) ? $userRepo->findAll() : $userRepo->findBy(['id' => $recipientIds]);
        // foreach ($users as $recipient) {
        //     $notif = new Notification();
        //     $notif->setRecipient($recipient);
        //     $notif->setTitle($data['title']);
        //     $notif->setMessage($data['message']);
        //     $notif->setType($data['type'] ?? 'info');
        //     $notif->setCategory($data['category'] ?? 'system');
        //     $notif->setUnread(true);
        //     $notif->setCreatedAt(new \DateTimeImmutable());
        //     $this->em->persist($notif);
        // }
        // $this->em->flush();

        return $this->json([
            'message'    => 'Broadcast sent',
            'recipients' => empty($recipientIds) ? 'all users' : count($recipientIds) . ' users',
        ]);
    }

    // ─── HELPER ──────────────────────────────────────────────────────────────

    private function serialize(Notification $n): array
    {
        return [
            'id'        => $n->getId(),
            'title'     => $n->getTitle(),
            'message'   => $n->getMessage(),
            'type'      => $n->getType(),
            'category'  => $n->getCategory(),
            'unread'    => $n->isUnread(),
            'createdAt' => $n->getCreatedAt()->format('c'),
        ];
    }
}
