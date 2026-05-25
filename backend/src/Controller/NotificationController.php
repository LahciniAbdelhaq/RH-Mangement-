<?php

namespace App\Controller;

use App\Entity\User;
use App\Repository\NotificationRepository;
use App\Service\ApiResponseService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/notifications')]
class NotificationController extends AbstractController
{
    public function __construct(
        private readonly ApiResponseService $apiResponse,
        private readonly EntityManagerInterface $em,
        private readonly NotificationRepository $notificationRepo,
    ) {}

    #[Route('', name: 'api_notifications_list', methods: ['GET'])]
    public function index(#[CurrentUser] ?User $user): JsonResponse
    {
        $employe = $user?->getEmploye();
        if (!$employe) {
            return $this->apiResponse->success([], 'Aucune notification');
        }

        $notifications = $this->notificationRepo->findBy(
            ['employe' => $employe],
            ['createdAt' => 'DESC'],
            50
        );

        return $this->apiResponse->success($notifications, 'Notifications', 200, ['notification:read']);
    }

    #[Route('/{id}/read', name: 'api_notifications_read', methods: ['PUT'], requirements: ['id' => '\d+'])]
    public function markRead(int $id, #[CurrentUser] ?User $user): JsonResponse
    {
        $notification = $this->notificationRepo->find($id);
        if (!$notification) {
            return $this->apiResponse->notFound('Notification introuvable');
        }

        if ($notification->getEmploye()->getId() !== $user?->getEmploye()?->getId()) {
            return $this->apiResponse->forbidden();
        }

        $notification->setIsRead(true);
        $this->em->flush();

        return $this->apiResponse->success(null, 'Notification marquée comme lue');
    }

    #[Route('/read-all', name: 'api_notifications_read_all', methods: ['PUT'])]
    public function markAllRead(#[CurrentUser] ?User $user): JsonResponse
    {
        $employe = $user?->getEmploye();
        if (!$employe) {
            return $this->apiResponse->success(null, 'OK');
        }

        $unread = $this->notificationRepo->findUnreadByEmploye($employe->getId());
        foreach ($unread as $n) {
            $n->setIsRead(true);
        }
        $this->em->flush();

        return $this->apiResponse->success(null, 'Toutes les notifications marquées comme lues');
    }
}
