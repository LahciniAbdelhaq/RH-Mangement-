<?php

namespace App\Controller;

use App\Entity\Affectation;
use App\Entity\User;
use App\Repository\AffectationRepository;
use App\Repository\EmployeRepository;
use App\Repository\ServiceRHRepository;
use App\Service\ApiResponseService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/affectations')]
class AffectationController extends AbstractController
{
    public function __construct(
        private readonly ApiResponseService $apiResponse,
        private readonly EntityManagerInterface $em,
        private readonly AffectationRepository $affectationRepo,
    ) {}

    #[Route('', name: 'api_affectations_list', methods: ['GET'])]
    public function index(Request $request, #[CurrentUser] ?User $user): JsonResponse
    {
        if ($this->isGranted('ROLE_AGENT_RH')) {
            $affectations = $this->affectationRepo->findAll();
        } else {
            $employe = $user?->getEmploye();
            if (!$employe) {
                return $this->apiResponse->success([], 'Aucune affectation');
            }
            $affectations = $this->affectationRepo->findBy(['employe' => $employe], ['dateDebut' => 'DESC']);
        }

        return $this->apiResponse->success($affectations, 'Liste des affectations', 200, ['affectation:read']);
    }

    #[Route('', name: 'api_affectations_create', methods: ['POST'])]
    public function create(
        Request $request,
        EmployeRepository $employeRepo,
        ServiceRHRepository $serviceRepo
    ): JsonResponse {
        if (!$this->isGranted('ROLE_AGENT_RH')) {
            return $this->apiResponse->forbidden();
        }

        $data = json_decode($request->getContent(), true);
        if (!$data) {
            return $this->apiResponse->error('Données invalides');
        }

        $employe = $employeRepo->find($data['employe_id'] ?? 0);
        if (!$employe) {
            return $this->apiResponse->notFound('Employé introuvable');
        }

        $affectation = new Affectation();
        $affectation->setEmploye($employe);
        $affectation->setPoste($data['poste'] ?? null);
        $affectation->setDateDebut(new \DateTime($data['dateDebut']));

        if (!empty($data['dateFin'])) {
            $affectation->setDateFin(new \DateTime($data['dateFin']));
        }

        if (!empty($data['service_id'])) {
            $service = $serviceRepo->find($data['service_id']);
            $affectation->setService($service);
        }

        // Mettre à jour le service actuel de l'employé
        if (isset($data['service_id'])) {
            $employe->setService($serviceRepo->find($data['service_id']));
        }
        if (isset($data['poste'])) {
            $employe->setPoste($data['poste']);
        }

        $this->em->persist($affectation);
        $this->em->flush();

        return $this->apiResponse->success($affectation, 'Affectation créée', 201, ['affectation:read']);
    }

    #[Route('/{id}', name: 'api_affectations_delete', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    public function delete(int $id): JsonResponse
    {
        if (!$this->isGranted('ROLE_AGENT_RH')) {
            return $this->apiResponse->forbidden();
        }

        $affectation = $this->affectationRepo->find($id);
        if (!$affectation) {
            return $this->apiResponse->notFound('Affectation introuvable');
        }

        $this->em->remove($affectation);
        $this->em->flush();

        return $this->apiResponse->success(null, 'Affectation supprimée');
    }
}
