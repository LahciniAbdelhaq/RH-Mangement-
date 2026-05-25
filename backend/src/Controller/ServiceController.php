<?php

namespace App\Controller;

use App\Entity\ServiceRH;
use App\Repository\ServiceRHRepository;
use App\Service\ApiResponseService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/services')]
class ServiceController extends AbstractController
{
    public function __construct(
        private readonly ApiResponseService $apiResponse,
        private readonly EntityManagerInterface $em,
        private readonly ServiceRHRepository $serviceRepo,
    ) {}

    #[Route('', name: 'api_services_list', methods: ['GET'])]
    public function index(): JsonResponse
    {
        $services = $this->serviceRepo->findAll();
        return $this->apiResponse->success($services, 'Liste des services', 200, ['service:read']);
    }

    #[Route('/{id}', name: 'api_services_show', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function show(int $id): JsonResponse
    {
        $service = $this->serviceRepo->find($id);
        if (!$service) {
            return $this->apiResponse->notFound('Service introuvable');
        }
        return $this->apiResponse->success($service, 'Détail service', 200, ['service:read']);
    }

    #[Route('', name: 'api_services_create', methods: ['POST'])]
    public function create(Request $request, ValidatorInterface $validator): JsonResponse
    {
        if (!$this->isGranted('ROLE_ADMIN_RH')) {
            return $this->apiResponse->forbidden();
        }

        $data = json_decode($request->getContent(), true);
        if (!$data) {
            return $this->apiResponse->error('Données invalides');
        }

        $service = new ServiceRH();
        $service->setNom($data['nom'] ?? '');
        $service->setDescription($data['description'] ?? null);

        $errors = $validator->validate($service);
        if (count($errors) > 0) {
            $errList = [];
            foreach ($errors as $error) {
                $errList[$error->getPropertyPath()] = $error->getMessage();
            }
            return $this->apiResponse->error('Validation échouée', 422, $errList);
        }

        $this->em->persist($service);
        $this->em->flush();

        return $this->apiResponse->success($service, 'Service créé', 201, ['service:read']);
    }

    #[Route('/{id}', name: 'api_services_update', methods: ['PUT'], requirements: ['id' => '\d+'])]
    public function update(int $id, Request $request, ValidatorInterface $validator): JsonResponse
    {
        if (!$this->isGranted('ROLE_ADMIN_RH')) {
            return $this->apiResponse->forbidden();
        }

        $service = $this->serviceRepo->find($id);
        if (!$service) {
            return $this->apiResponse->notFound('Service introuvable');
        }

        $data = json_decode($request->getContent(), true);
        if (isset($data['nom']))         $service->setNom($data['nom']);
        if (isset($data['description'])) $service->setDescription($data['description']);

        $errors = $validator->validate($service);
        if (count($errors) > 0) {
            $errList = [];
            foreach ($errors as $error) {
                $errList[$error->getPropertyPath()] = $error->getMessage();
            }
            return $this->apiResponse->error('Validation échouée', 422, $errList);
        }

        $this->em->flush();

        return $this->apiResponse->success($service, 'Service mis à jour', 200, ['service:read']);
    }

    #[Route('/{id}', name: 'api_services_delete', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    public function delete(int $id): JsonResponse
    {
        if (!$this->isGranted('ROLE_ADMIN_RH')) {
            return $this->apiResponse->forbidden();
        }

        $service = $this->serviceRepo->find($id);
        if (!$service) {
            return $this->apiResponse->notFound('Service introuvable');
        }

        $this->em->remove($service);
        $this->em->flush();

        return $this->apiResponse->success(null, 'Service supprimé');
    }
}
