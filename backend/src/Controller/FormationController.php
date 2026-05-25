<?php

namespace App\Controller;

use App\Entity\Formation;
use App\Entity\User;
use App\Repository\FormationRepository;
use App\Service\ApiResponseService;
use App\Service\NotificationService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/formations')]
class FormationController extends AbstractController
{
    public function __construct(
        private readonly ApiResponseService $apiResponse,
        private readonly EntityManagerInterface $em,
        private readonly FormationRepository $formationRepo,
        private readonly NotificationService $notificationService,
    ) {}

    #[Route('', name: 'api_formations_list', methods: ['GET'])]
    public function index(): JsonResponse
    {
        $formations = $this->formationRepo->findAll();
        return $this->apiResponse->success($formations, 'Liste des formations', 200, ['formation:read']);
    }

    #[Route('/{id}', name: 'api_formations_show', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function show(int $id): JsonResponse
    {
        $formation = $this->formationRepo->find($id);
        if (!$formation) {
            return $this->apiResponse->notFound('Formation introuvable');
        }
        return $this->apiResponse->success($formation, 'Détail formation', 200, ['formation:read']);
    }

    #[Route('', name: 'api_formations_create', methods: ['POST'])]
    public function create(Request $request, ValidatorInterface $validator): JsonResponse
    {
        if (!$this->isGranted('ROLE_AGENT_RH')) {
            return $this->apiResponse->forbidden();
        }

        $data = json_decode($request->getContent(), true);
        if (!$data) {
            return $this->apiResponse->error('Données invalides');
        }

        $formation = new Formation();
        $this->hydrateFormation($formation, $data);

        $errors = $validator->validate($formation);
        if (count($errors) > 0) {
            $errList = [];
            foreach ($errors as $error) {
                $errList[$error->getPropertyPath()] = $error->getMessage();
            }
            return $this->apiResponse->error('Validation échouée', 422, $errList);
        }

        $this->em->persist($formation);
        $this->em->flush();

        return $this->apiResponse->success($formation, 'Formation créée', 201, ['formation:read']);
    }

    #[Route('/{id}', name: 'api_formations_update', methods: ['PUT'], requirements: ['id' => '\d+'])]
    public function update(int $id, Request $request, ValidatorInterface $validator): JsonResponse
    {
        if (!$this->isGranted('ROLE_AGENT_RH')) {
            return $this->apiResponse->forbidden();
        }

        $formation = $this->formationRepo->find($id);
        if (!$formation) {
            return $this->apiResponse->notFound('Formation introuvable');
        }

        $data = json_decode($request->getContent(), true);
        $this->hydrateFormation($formation, $data ?? []);

        $errors = $validator->validate($formation);
        if (count($errors) > 0) {
            $errList = [];
            foreach ($errors as $error) {
                $errList[$error->getPropertyPath()] = $error->getMessage();
            }
            return $this->apiResponse->error('Validation échouée', 422, $errList);
        }

        $this->em->flush();

        return $this->apiResponse->success($formation, 'Formation mise à jour', 200, ['formation:read']);
    }

    #[Route('/{id}', name: 'api_formations_delete', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    public function delete(int $id): JsonResponse
    {
        if (!$this->isGranted('ROLE_AGENT_RH')) {
            return $this->apiResponse->forbidden();
        }

        $formation = $this->formationRepo->find($id);
        if (!$formation) {
            return $this->apiResponse->notFound('Formation introuvable');
        }

        $this->em->remove($formation);
        $this->em->flush();

        return $this->apiResponse->success(null, 'Formation supprimée');
    }

    #[Route('/{id}/participer', name: 'api_formations_participer', methods: ['POST'], requirements: ['id' => '\d+'])]
    public function participer(int $id, #[CurrentUser] ?User $user): JsonResponse
    {
        $formation = $this->formationRepo->find($id);
        if (!$formation) {
            return $this->apiResponse->notFound('Formation introuvable');
        }

        $employe = $user?->getEmploye();
        if (!$employe) {
            return $this->apiResponse->error('Profil employé introuvable', 403);
        }

        if ($formation->getCapacite() && $formation->getParticipants()->count() >= $formation->getCapacite()) {
            return $this->apiResponse->error('La formation est complète');
        }

        $formation->addParticipant($employe);
        $this->em->flush();

        $this->notificationService->notify(
            $employe,
            'Inscription formation',
            sprintf('Vous êtes inscrit à la formation "%s".', $formation->getTitre()),
            'success'
        );

        return $this->apiResponse->success(null, 'Inscription confirmée');
    }

    #[Route('/{id}/quitter', name: 'api_formations_quitter', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    public function quitter(int $id, #[CurrentUser] ?User $user): JsonResponse
    {
        $formation = $this->formationRepo->find($id);
        if (!$formation) {
            return $this->apiResponse->notFound('Formation introuvable');
        }

        $employe = $user?->getEmploye();
        if (!$employe) {
            return $this->apiResponse->error('Profil employé introuvable', 403);
        }

        $formation->removeParticipant($employe);
        $this->em->flush();

        return $this->apiResponse->success(null, 'Désinscription confirmée');
    }

    private function hydrateFormation(Formation $formation, array $data): void
    {
        if (isset($data['titre']))       $formation->setTitre($data['titre']);
        if (isset($data['description'])) $formation->setDescription($data['description']);
        if (isset($data['lieu']))        $formation->setLieu($data['lieu']);
        if (isset($data['capacite']))    $formation->setCapacite((int)$data['capacite']);
        if (isset($data['statut']))      $formation->setStatut($data['statut']);
        if (isset($data['dateDebut']))   $formation->setDateDebut(new \DateTime($data['dateDebut']));
        if (isset($data['dateFin']))     $formation->setDateFin(new \DateTime($data['dateFin']));
    }
}
