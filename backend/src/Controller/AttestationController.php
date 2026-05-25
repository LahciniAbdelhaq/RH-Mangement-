<?php

namespace App\Controller;

use App\Entity\Attestation;
use App\Entity\User;
use App\Repository\AttestationRepository;
use App\Service\ApiResponseService;
use App\Service\NotificationService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\KernelInterface;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/attestations')]
class AttestationController extends AbstractController
{
    public function __construct(
        private readonly ApiResponseService $apiResponse,
        private readonly EntityManagerInterface $em,
        private readonly AttestationRepository $attestationRepo,
        private readonly NotificationService $notificationService,
    ) {}

    #[Route('', name: 'api_attestations_list', methods: ['GET'])]
    public function index(#[CurrentUser] ?User $user): JsonResponse
    {
        if ($this->isGranted('ROLE_AGENT_RH')) {
            $attestations = $this->attestationRepo->findAll();
        } else {
            $employe = $user?->getEmploye();
            if (!$employe) {
                return $this->apiResponse->success([], 'Aucune attestation');
            }
            $attestations = $this->attestationRepo->findBy(['employe' => $employe]);
        }

        return $this->apiResponse->success($attestations, 'Liste des attestations', 200, ['attestation:read']);
    }

    #[Route('', name: 'api_attestations_create', methods: ['POST'])]
    public function create(Request $request, #[CurrentUser] ?User $user): JsonResponse
    {
        $employe = $user?->getEmploye();
        if (!$employe) {
            return $this->apiResponse->error('Profil employé introuvable', 403);
        }

        $data = json_decode($request->getContent(), true);
        if (!$data || empty($data['type'])) {
            return $this->apiResponse->error('Type d\'attestation obligatoire');
        }

        $types = [Attestation::TYPE_TRAVAIL, Attestation::TYPE_SALAIRE, Attestation::TYPE_ADMINISTRATIF];
        if (!in_array($data['type'], $types)) {
            return $this->apiResponse->error('Type d\'attestation invalide');
        }

        $attestation = new Attestation();
        $attestation->setEmploye($employe);
        $attestation->setType($data['type']);

        $this->em->persist($attestation);
        $this->em->flush();

        return $this->apiResponse->success($attestation, 'Demande d\'attestation soumise', 201, ['attestation:read']);
    }

    #[Route('/{id}/generate', name: 'api_attestations_generate', methods: ['POST'], requirements: ['id' => '\d+'])]
    public function generate(int $id): JsonResponse
    {
        if (!$this->isGranted('ROLE_AGENT_RH')) {
            return $this->apiResponse->forbidden();
        }

        $attestation = $this->attestationRepo->find($id);
        if (!$attestation) {
            return $this->apiResponse->notFound('Attestation introuvable');
        }

        $attestation->setStatut(Attestation::STATUT_GENEREE);
        $attestation->setDateGeneration(new \DateTimeImmutable());

        $this->em->flush();

        $this->notificationService->notify(
            $attestation->getEmploye(),
            'Attestation disponible',
            sprintf('Votre attestation de %s est disponible.', $attestation->getType()),
            'success'
        );

        return $this->apiResponse->success($attestation, 'Attestation générée', 200, ['attestation:read']);
    }

    #[Route('/{id}/sign', name: 'api_attestations_sign', methods: ['POST'], requirements: ['id' => '\d+'])]
    public function sign(int $id): JsonResponse
    {
        if (!$this->isGranted('ROLE_SECRETAIRE_GENERALE') && !$this->isGranted('ROLE_AGENT_RH')) {
            return $this->apiResponse->forbidden();
        }

        $attestation = $this->attestationRepo->find($id);
        if (!$attestation) {
            return $this->apiResponse->notFound('Attestation introuvable');
        }

        if ($this->isGranted('ROLE_SECRETAIRE_GENERALE')) {
            $attestation->setStatut(Attestation::STATUT_SIGNEE);
        } else {
            $attestation->setSignatureRH(true);
        }

        $this->em->flush();

        return $this->apiResponse->success($attestation, 'Attestation signée', 200, ['attestation:read']);
    }
}
