<?php

namespace App\Controller;

use App\Entity\User;
use App\Service\ApiResponseService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api')]
class AuthController extends AbstractController
{
    public function __construct(
        private readonly ApiResponseService $apiResponse,
        private readonly EntityManagerInterface $em,
        private readonly UserPasswordHasherInterface $passwordHasher,
    ) {}

    #[Route('/me', name: 'api_me', methods: ['GET'])]
    public function me(#[CurrentUser] ?User $user): JsonResponse
    {
        if (!$user) {
            return $this->apiResponse->error('Non authentifié', 401);
        }

        $employe = $user->getEmploye();
        $data = [
            'id'       => $user->getId(),
            'email'    => $user->getEmail(),
            'roles'    => $user->getRoles(),
            'isActive' => $user->isActive(),
        ];

        if ($employe) {
            $data['employe'] = [
                'id'               => $employe->getId(),
                'nom'              => $employe->getNom(),
                'prenom'           => $employe->getPrenom(),
                'cin'              => $employe->getCin(),
                'telephone'        => $employe->getTelephone(),
                'adresse'          => $employe->getAdresse(),
                'dateNaissance'    => $employe->getDateNaissance()?->format('Y-m-d'),
                'sexe'             => $employe->getSexe(),
                'situationFamiliale' => $employe->getSituationFamiliale(),
                'conjoint'         => $employe->getConjoint(),
                'nombreEnfants'    => $employe->getNombreEnfants(),
                'matricule'        => $employe->getMatricule(),
                'poste'            => $employe->getPoste(),
                'grade'            => $employe->getGrade(),
                'echelle'          => $employe->getEchelle(),
                'dateRecrutement'  => $employe->getDateRecrutement()?->format('Y-m-d'),
                'statut'           => $employe->getStatut(),
                'photo'            => $employe->getPhoto(),
                'service'          => $employe->getService() ? [
                    'id'  => $employe->getService()->getId(),
                    'nom' => $employe->getService()->getNom(),
                ] : null,
            ];
        }

        return $this->apiResponse->success($data, 'Utilisateur connecté');
    }

    #[Route('/change-password', name: 'api_change_password', methods: ['POST'])]
    public function changePassword(Request $request, #[CurrentUser] ?User $user): JsonResponse
    {
        if (!$user) {
            return $this->apiResponse->error('Non authentifié', 401);
        }

        $data = json_decode($request->getContent(), true);
        if (empty($data['currentPassword']) || empty($data['newPassword'])) {
            return $this->apiResponse->error('Champs obligatoires manquants');
        }

        if (!$this->passwordHasher->isPasswordValid($user, $data['currentPassword'])) {
            return $this->apiResponse->error('Mot de passe actuel incorrect', 400);
        }

        if (strlen($data['newPassword']) < 6) {
            return $this->apiResponse->error('Le nouveau mot de passe doit contenir au moins 6 caractères', 400);
        }

        $hashed = $this->passwordHasher->hashPassword($user, $data['newPassword']);
        $user->setPassword($hashed);
        $this->em->flush();

        return $this->apiResponse->success([], 'Mot de passe mis à jour avec succès');
    }

    #[Route('/register', name: 'api_register', methods: ['POST'])]
    public function register(
        Request $request,
        ValidatorInterface $validator
    ): JsonResponse {
        if (!$this->isGranted('ROLE_ADMIN_RH')) {
            return $this->apiResponse->forbidden();
        }

        $data = json_decode($request->getContent(), true);
        if (!$data) {
            return $this->apiResponse->error('Données invalides');
        }

        $user = new User();
        $user->setEmail($data['email'] ?? '');
        $user->setRoles($data['roles'] ?? ['ROLE_EMPLOYE']);
        $user->setIsActive($data['isActive'] ?? true);

        $errors = $validator->validate($user);
        if (count($errors) > 0) {
            $errList = [];
            foreach ($errors as $error) {
                $errList[$error->getPropertyPath()] = $error->getMessage();
            }
            return $this->apiResponse->error('Validation échouée', 422, $errList);
        }

        if (empty($data['password'])) {
            return $this->apiResponse->error('Le mot de passe est obligatoire');
        }

        $hashed = $this->passwordHasher->hashPassword($user, $data['password']);
        $user->setPassword($hashed);

        $this->em->persist($user);
        $this->em->flush();

        return $this->apiResponse->success(['id' => $user->getId(), 'email' => $user->getEmail()], 'Utilisateur créé', 201);
    }
}
