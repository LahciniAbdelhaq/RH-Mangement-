<?php

namespace App\Controller;

use App\Entity\Employe;
use App\Entity\ServiceRH;
use App\Entity\User;
use App\Repository\EmployeRepository;
use App\Repository\ServiceRHRepository;
use App\Service\ApiResponseService;
use App\Service\UploadService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/employes')]
class EmployeController extends AbstractController
{
    public function __construct(
        private readonly ApiResponseService $apiResponse,
        private readonly EntityManagerInterface $em,
        private readonly EmployeRepository $employeRepo,
    ) {}

    #[Route('', name: 'api_employes_list', methods: ['GET'])]
    public function index(Request $request): JsonResponse
    {
        if (!$this->isGranted('ROLE_AGENT_RH')) {
            return $this->apiResponse->forbidden();
        }

        $filters = [
            'search'  => $request->query->get('search'),
            'service' => $request->query->get('service'),
            'statut'  => $request->query->get('statut'),
        ];
        $page  = max(1, (int) $request->query->get('page', 1));
        $limit = min(100, max(1, (int) $request->query->get('limit', 20)));

        $result = $this->employeRepo->findWithFilters($filters, $page, $limit);

        return $this->apiResponse->paginated($result, 'Liste des employés', ['employe:read']);
    }

    #[Route('/{id}', name: 'api_employes_show', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function show(int $id, #[CurrentUser] ?User $currentUser): JsonResponse
    {
        $employe = $this->employeRepo->find($id);
        if (!$employe) {
            return $this->apiResponse->notFound('Employé introuvable');
        }

        // Employé peut voir son propre profil
        if (!$this->isGranted('ROLE_AGENT_RH')) {
            $myEmploye = $currentUser?->getEmploye();
            if (!$myEmploye || $myEmploye->getId() !== $id) {
                return $this->apiResponse->forbidden();
            }
        }

        return $this->apiResponse->success($employe, 'Détail employé', 200, ['employe:read']);
    }

    #[Route('', name: 'api_employes_create', methods: ['POST'])]
    public function create(
        Request $request,
        ValidatorInterface $validator,
        ServiceRHRepository $serviceRepo,
        UserPasswordHasherInterface $passwordHasher
    ): JsonResponse {
        if (!$this->isGranted('ROLE_AGENT_RH')) {
            return $this->apiResponse->forbidden();
        }

        $data = json_decode($request->getContent(), true);
        if (!$data) {
            return $this->apiResponse->error('Données invalides');
        }

        $employe = new Employe();
        $this->hydrateEmploye($employe, $data, $serviceRepo);

        // Auto-generate matricule if not provided
        if (empty($data['matricule'])) {
            $employe->setMatricule('EMP-' . strtoupper(substr(uniqid(), -6)));
        }

        $errors = $validator->validate($employe);
        if (count($errors) > 0) {
            $errList = [];
            foreach ($errors as $error) {
                $errList[$error->getPropertyPath()] = $error->getMessage();
            }
            return $this->apiResponse->error('Validation échouée', 422, $errList);
        }

        // Créer un compte utilisateur si email fourni
        if (!empty($data['email'])) {
            $existingUser = $this->em->getRepository(User::class)->findOneBy(['email' => $data['email']]);
            if ($existingUser) {
                return $this->apiResponse->error('Un compte avec cet email existe déjà', 422);
            }
            $user = new User();
            $user->setEmail($data['email']);
            $user->setRoles($data['roles'] ?? ['ROLE_EMPLOYE']);
            $password = $data['password'] ?? bin2hex(random_bytes(8));
            $user->setPassword($passwordHasher->hashPassword($user, $password));
            $this->em->persist($user);
            $employe->setUser($user);
        }

        $this->em->persist($employe);
        $this->em->flush();

        return $this->apiResponse->success($employe, 'Employé créé avec succès', 201, ['employe:read']);
    }

    #[Route('/{id}', name: 'api_employes_update', methods: ['PUT', 'PATCH'], requirements: ['id' => '\d+'])]
    public function update(
        int $id,
        Request $request,
        ValidatorInterface $validator,
        ServiceRHRepository $serviceRepo,
        #[CurrentUser] ?User $currentUser
    ): JsonResponse {
        $employe = $this->employeRepo->find($id);
        if (!$employe) {
            return $this->apiResponse->notFound('Employé introuvable');
        }

        // Seul l'agent RH peut modifier, ou l'employé ses propres données non-sensibles
        $isRH = $this->isGranted('ROLE_AGENT_RH');
        $isOwner = $currentUser?->getEmploye()?->getId() === $id;

        if (!$isRH && !$isOwner) {
            return $this->apiResponse->forbidden();
        }

        $data = json_decode($request->getContent(), true);
        if (!$data) {
            return $this->apiResponse->error('Données invalides');
        }

        // Champs sensibles réservés aux agents RH
        if (!$isRH) {
            unset($data['matricule'], $data['grade'], $data['echelle'], $data['salaire'], $data['statut'], $data['roles']);
        }

        $this->hydrateEmploye($employe, $data, $serviceRepo);

        $errors = $validator->validate($employe);
        if (count($errors) > 0) {
            $errList = [];
            foreach ($errors as $error) {
                $errList[$error->getPropertyPath()] = $error->getMessage();
            }
            return $this->apiResponse->error('Validation échouée', 422, $errList);
        }

        $this->em->flush();

        return $this->apiResponse->success($employe, 'Employé mis à jour', 200, ['employe:read']);
    }

    #[Route('/{id}', name: 'api_employes_delete', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    public function delete(int $id): JsonResponse
    {
        if (!$this->isGranted('ROLE_ADMIN_RH')) {
            return $this->apiResponse->forbidden();
        }

        $employe = $this->employeRepo->find($id);
        if (!$employe) {
            return $this->apiResponse->notFound('Employé introuvable');
        }

        $this->em->remove($employe);
        $this->em->flush();

        return $this->apiResponse->success(null, 'Employé supprimé');
    }

    #[Route('/{id}/photo', name: 'api_employes_photo', methods: ['POST'], requirements: ['id' => '\d+'])]
    public function uploadPhoto(int $id, Request $request, UploadService $uploadService): JsonResponse
    {
        $employe = $this->employeRepo->find($id);
        if (!$employe) {
            return $this->apiResponse->notFound('Employé introuvable');
        }

        $file = $request->files->get('photo');
        if (!$file) {
            return $this->apiResponse->error('Aucun fichier fourni');
        }

        try {
            $path = $uploadService->upload($file, 'photos');
            $employe->setPhoto('/uploads/' . $path);
            $this->em->flush();
            return $this->apiResponse->success(['photo' => $employe->getPhoto()], 'Photo mise à jour');
        } catch (\InvalidArgumentException $e) {
            return $this->apiResponse->error($e->getMessage());
        }
    }

    private function hydrateEmploye(Employe $employe, array $data, ServiceRHRepository $serviceRepo): void
    {
        if (isset($data['nom']))              $employe->setNom($data['nom']);
        if (isset($data['prenom']))           $employe->setPrenom($data['prenom']);
        if (isset($data['cin']))              $employe->setCin($data['cin']);
        if (isset($data['telephone']))        $employe->setTelephone($data['telephone']);
        if (isset($data['adresse']))          $employe->setAdresse($data['adresse']);
        if (isset($data['sexe']))             $employe->setSexe($data['sexe']);
        if (isset($data['situationFamiliale'])) $employe->setSituationFamiliale($data['situationFamiliale']);
        if (isset($data['conjoint']))         $employe->setConjoint($data['conjoint']);
        if (isset($data['nombreEnfants']))    $employe->setNombreEnfants((int)$data['nombreEnfants']);
        if (isset($data['matricule']))        $employe->setMatricule($data['matricule']);
        if (isset($data['poste']))            $employe->setPoste($data['poste']);
        if (isset($data['grade']))            $employe->setGrade($data['grade']);
        if (isset($data['echelle']))          $employe->setEchelle($data['echelle']);
        if (isset($data['statut']))           $employe->setStatut($data['statut']);
        if (isset($data['salaire']))          $employe->setSalaire($data['salaire']);
        if (isset($data['dateNaissance']))    $employe->setDateNaissance(new \DateTime($data['dateNaissance']));
        if (isset($data['dateRecrutement']))  $employe->setDateRecrutement(new \DateTime($data['dateRecrutement']));

        if (isset($data['service_id'])) {
            $service = $serviceRepo->find($data['service_id']);
            $employe->setService($service);
        }
    }
}
