<?php

namespace App\Controller;

use App\Entity\Absence;
use App\Entity\User;
use App\Repository\AbsenceRepository;
use App\Service\ApiResponseService;
use App\Service\UploadService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/absences')]
class AbsenceController extends AbstractController
{
    public function __construct(
        private readonly ApiResponseService $apiResponse,
        private readonly EntityManagerInterface $em,
        private readonly AbsenceRepository $absenceRepo,
    ) {}

    #[Route('', name: 'api_absences_list', methods: ['GET'])]
    public function index(#[CurrentUser] ?User $user): JsonResponse
    {
        if ($this->isGranted('ROLE_AGENT_RH')) {
            $absences = $this->absenceRepo->findAll();
        } else {
            $employe = $user?->getEmploye();
            if (!$employe) {
                return $this->apiResponse->success([], 'Aucune absence');
            }
            $absences = $this->absenceRepo->findBy(['employe' => $employe]);
        }

        return $this->apiResponse->success($absences, 'Liste des absences', 200, ['absence:read']);
    }

    #[Route('', name: 'api_absences_create', methods: ['POST'])]
    public function create(Request $request, #[CurrentUser] ?User $user): JsonResponse
    {
        if (!$this->isGranted('ROLE_AGENT_RH')) {
            return $this->apiResponse->forbidden();
        }

        $data = json_decode($request->getContent(), true);
        if (!$data) {
            return $this->apiResponse->error('Données invalides');
        }

        $employe = $this->em->getRepository(\App\Entity\Employe::class)->find($data['employe_id'] ?? 0);
        if (!$employe) {
            return $this->apiResponse->notFound('Employé introuvable');
        }

        $absence = new Absence();
        $absence->setEmploye($employe);
        $absence->setType($data['type'] ?? null);
        $absence->setMotif($data['motif'] ?? null);
        $absence->setDateDebut(new \DateTime($data['dateDebut']));
        $absence->setDateFin(new \DateTime($data['dateFin']));
        $absence->setStatut($data['statut'] ?? Absence::STATUT_EN_ATTENTE);

        $this->em->persist($absence);
        $this->em->flush();

        return $this->apiResponse->success($absence, 'Absence enregistrée', 201, ['absence:read']);
    }

    #[Route('/{id}', name: 'api_absences_update', methods: ['PUT'], requirements: ['id' => '\d+'])]
    public function update(int $id, Request $request): JsonResponse
    {
        if (!$this->isGranted('ROLE_AGENT_RH')) {
            return $this->apiResponse->forbidden();
        }

        $absence = $this->absenceRepo->find($id);
        if (!$absence) {
            return $this->apiResponse->notFound('Absence introuvable');
        }

        $data = json_decode($request->getContent(), true) ?? [];
        if (isset($data['statut']))    $absence->setStatut($data['statut']);
        if (isset($data['motif']))     $absence->setMotif($data['motif']);
        if (isset($data['type']))      $absence->setType($data['type']);

        $this->em->flush();

        return $this->apiResponse->success($absence, 'Absence mise à jour', 200, ['absence:read']);
    }
}
