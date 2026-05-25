<?php

namespace App\Controller;

use App\Entity\Conge;
use App\Entity\User;
use App\Repository\CongeRepository;
use App\Repository\EmployeRepository;
use App\Service\ApiResponseService;
use App\Service\NotificationService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/conges')]
class CongeController extends AbstractController
{
    public function __construct(
        private readonly ApiResponseService $apiResponse,
        private readonly EntityManagerInterface $em,
        private readonly CongeRepository $congeRepo,
        private readonly NotificationService $notificationService,
    ) {}

    #[Route('', name: 'api_conges_list', methods: ['GET'])]
    public function index(Request $request, #[CurrentUser] ?User $user): JsonResponse
    {
        if ($this->isGranted('ROLE_AGENT_RH')) {
            $conges = $this->congeRepo->findAll();
        } elseif ($this->isGranted('ROLE_CHEF_SERVICE')) {
            $employe = $user?->getEmploye();
            $service = $employe?->getService();
            if (!$service) {
                return $this->apiResponse->success([], 'Aucun congé');
            }
            $conges = $this->congeRepo->findPendingForService($service->getId());
        } else {
            $employe = $user?->getEmploye();
            if (!$employe) {
                return $this->apiResponse->success([], 'Aucun congé');
            }
            $conges = $this->congeRepo->findByEmploye($employe->getId());
        }

        return $this->apiResponse->success($conges, 'Liste des congés', 200, ['conge:read']);
    }

    #[Route('', name: 'api_conges_create', methods: ['POST'])]
    public function create(Request $request, #[CurrentUser] ?User $user): JsonResponse
    {
        $employe = $user?->getEmploye();
        if (!$employe) {
            return $this->apiResponse->error('Profil employé introuvable', 403);
        }

        $data = json_decode($request->getContent(), true);
        if (!$data) {
            return $this->apiResponse->error('Données invalides');
        }

        $conge = new Conge();
        $conge->setEmploye($employe);
        $conge->setDateDebut(new \DateTime($data['dateDebut']));
        $conge->setDateFin(new \DateTime($data['dateFin']));
        $conge->setMotif($data['motif'] ?? null);
        $conge->setCommentaire($data['commentaire'] ?? null);

        // Calculer le nombre de jours
        $diff = $conge->getDateDebut()->diff($conge->getDateFin());
        $conge->setNombreJours($diff->days + 1);

        $this->em->persist($conge);
        $this->em->flush();

        return $this->apiResponse->success($conge, 'Demande de congé soumise', 201, ['conge:read']);
    }

    #[Route('/{id}', name: 'api_conges_show', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function show(int $id): JsonResponse
    {
        $conge = $this->congeRepo->find($id);
        if (!$conge) {
            return $this->apiResponse->notFound('Congé introuvable');
        }
        return $this->apiResponse->success($conge, 'Détail congé', 200, ['conge:read']);
    }

    #[Route('/{id}/approve', name: 'api_conges_approve', methods: ['PUT'], requirements: ['id' => '\d+'])]
    public function approve(int $id, Request $request, #[CurrentUser] ?User $user): JsonResponse
    {
        $conge = $this->congeRepo->find($id);
        if (!$conge) {
            return $this->apiResponse->notFound('Congé introuvable');
        }

        $data = json_decode($request->getContent(), true) ?? [];

        if ($this->isGranted('ROLE_AGENT_RH')) {
            $conge->setStatut(Conge::STATUT_APPROUVE);
            $conge->setSignatureRH(true);
            $conge->setCommentaire($data['commentaire'] ?? $conge->getCommentaire());
            $this->notificationService->notifyCongeStatut($conge->getEmploye(), Conge::STATUT_APPROUVE);
        } elseif ($this->isGranted('ROLE_CHEF_SERVICE')) {
            $conge->setStatut(Conge::STATUT_APPROUVE_CHEF);
            $conge->setSignatureChef(true);
            $this->notificationService->notifyCongeStatut($conge->getEmploye(), Conge::STATUT_APPROUVE_CHEF);
        } else {
            return $this->apiResponse->forbidden();
        }

        $this->em->flush();

        return $this->apiResponse->success($conge, 'Congé approuvé', 200, ['conge:read']);
    }

    #[Route('/{id}/reject', name: 'api_conges_reject', methods: ['PUT'], requirements: ['id' => '\d+'])]
    public function reject(int $id, Request $request): JsonResponse
    {
        if (!$this->isGranted('ROLE_CHEF_SERVICE')) {
            return $this->apiResponse->forbidden();
        }

        $conge = $this->congeRepo->find($id);
        if (!$conge) {
            return $this->apiResponse->notFound('Congé introuvable');
        }

        $data = json_decode($request->getContent(), true) ?? [];
        $motif = $data['motifRefus'] ?? 'Aucun motif précisé';

        $conge->setStatut(Conge::STATUT_REFUSE);
        $conge->setMotifRefus($motif);

        $this->em->flush();

        $this->notificationService->notifyCongeStatut($conge->getEmploye(), Conge::STATUT_REFUSE, $motif);

        return $this->apiResponse->success($conge, 'Congé refusé', 200, ['conge:read']);
    }
}
