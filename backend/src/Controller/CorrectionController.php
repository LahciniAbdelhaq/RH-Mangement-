<?php

namespace App\Controller;

use App\Entity\CorrectionDemande;
use App\Entity\User;
use App\Repository\CorrectionDemandeRepository;
use App\Service\ApiResponseService;
use App\Service\NotificationService;
use App\Service\UploadService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/corrections')]
class CorrectionController extends AbstractController
{
    public function __construct(
        private readonly ApiResponseService $apiResponse,
        private readonly EntityManagerInterface $em,
        private readonly CorrectionDemandeRepository $correctionRepo,
        private readonly NotificationService $notificationService,
        private readonly UploadService $uploadService,
    ) {}

    #[Route('', name: 'api_corrections_list', methods: ['GET'])]
    public function index(#[CurrentUser] ?User $user): JsonResponse
    {
        if ($this->isGranted('ROLE_AGENT_RH')) {
            $corrections = $this->correctionRepo->findAll();
        } else {
            $employe = $user?->getEmploye();
            if (!$employe) {
                return $this->apiResponse->success([], 'Aucune correction');
            }
            $corrections = $this->correctionRepo->findBy(['employe' => $employe], ['dateCreation' => 'DESC']);
        }

        return $this->apiResponse->success($corrections, 'Liste des corrections', 200, ['correction:read']);
    }

    #[Route('/{id}', name: 'api_corrections_show', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function show(int $id, #[CurrentUser] ?User $user): JsonResponse
    {
        $correction = $this->correctionRepo->find($id);
        if (!$correction) {
            return $this->apiResponse->notFound('Correction introuvable');
        }

        $isRH = $this->isGranted('ROLE_AGENT_RH');
        $isOwner = $correction->getEmploye()->getId() === $user?->getEmploye()?->getId();
        if (!$isRH && !$isOwner) {
            return $this->apiResponse->forbidden();
        }

        $data = $correction;
        // Ajouter la comparaison dans la réponse
        return new JsonResponse([
            'success' => true,
            'message' => 'Détail correction',
            'data'    => $this->serializeCorrection($correction),
        ]);
    }

    #[Route('', name: 'api_corrections_create', methods: ['POST'])]
    public function create(Request $request, #[CurrentUser] ?User $user): JsonResponse
    {
        $employe = $user?->getEmploye();
        if (!$employe) {
            return $this->apiResponse->error('Profil employé introuvable', 403);
        }

        $data = json_decode($request->getContent(), true);
        if (!$data || empty($data['typeCorrection'])) {
            return $this->apiResponse->error('Type de correction obligatoire');
        }

        // Construire automatiquement l'ancienne valeur depuis le profil actuel
        $ancienneValeur = $this->buildCurrentValues($employe, $data['typeCorrection']);

        $correction = new CorrectionDemande();
        $correction->setEmploye($employe);
        $correction->setTypeCorrection($data['typeCorrection']);
        $correction->setAncienneValeur($ancienneValeur);
        $correction->setNouvelleValeur($data['nouvelleValeur'] ?? []);
        $correction->setJustification($data['justification'] ?? null);
        $correction->setCommentaire($data['commentaire'] ?? null);

        $this->em->persist($correction);
        $this->em->flush();

        return $this->apiResponse->success($this->serializeCorrection($correction), 'Demande de correction soumise', 201);
    }

    #[Route('/{id}/approve', name: 'api_corrections_approve', methods: ['PUT'], requirements: ['id' => '\d+'])]
    public function approve(int $id, Request $request): JsonResponse
    {
        if (!$this->isGranted('ROLE_AGENT_RH')) {
            return $this->apiResponse->forbidden();
        }

        $correction = $this->correctionRepo->find($id);
        if (!$correction) {
            return $this->apiResponse->notFound('Correction introuvable');
        }

        $data = json_decode($request->getContent(), true) ?? [];

        $correction->setStatut(CorrectionDemande::STATUT_APPROUVEE);
        $correction->setDateTraitement(new \DateTimeImmutable());
        $correction->setCommentaire($data['commentaire'] ?? null);

        // Appliquer les modifications sur le profil de l'employé
        $this->applyCorrection($correction);

        $this->em->flush();

        $this->notificationService->notifyCorrectionStatut($correction->getEmploye(), CorrectionDemande::STATUT_APPROUVEE);

        return $this->apiResponse->success($this->serializeCorrection($correction), 'Correction approuvée');
    }

    #[Route('/{id}/reject', name: 'api_corrections_reject', methods: ['PUT'], requirements: ['id' => '\d+'])]
    public function reject(int $id, Request $request): JsonResponse
    {
        if (!$this->isGranted('ROLE_AGENT_RH')) {
            return $this->apiResponse->forbidden();
        }

        $correction = $this->correctionRepo->find($id);
        if (!$correction) {
            return $this->apiResponse->notFound('Correction introuvable');
        }

        $data = json_decode($request->getContent(), true) ?? [];
        $motif = $data['motifRefus'] ?? 'Aucun motif précisé';

        $correction->setStatut(CorrectionDemande::STATUT_REFUSEE);
        $correction->setDateTraitement(new \DateTimeImmutable());
        $correction->setMotifRefus($motif);

        $this->em->flush();

        $this->notificationService->notifyCorrectionStatut($correction->getEmploye(), CorrectionDemande::STATUT_REFUSEE, $motif);

        return $this->apiResponse->success(null, 'Correction refusée');
    }

    private function buildCurrentValues(\App\Entity\Employe $employe, string $typeCorrection): array
    {
        $mapping = [
            'informations_personnelles' => [
                'nom', 'prenom', 'cin', 'telephone', 'adresse', 'sexe', 'situationFamiliale', 'conjoint', 'nombreEnfants'
            ],
            'informations_administratives' => [
                'matricule', 'poste', 'grade', 'echelle', 'statut'
            ],
        ];

        $fields = $mapping[$typeCorrection] ?? array_merge(...array_values($mapping));
        $values = [];
        foreach ($fields as $field) {
            $getter = 'get' . ucfirst($field);
            if (method_exists($employe, $getter)) {
                $val = $employe->$getter();
                $values[$field] = $val instanceof \DateTimeInterface ? $val->format('Y-m-d') : $val;
            }
        }
        return $values;
    }

    private function applyCorrection(CorrectionDemande $correction): void
    {
        $employe  = $correction->getEmploye();
        $nouvelle = $correction->getNouvelleValeur() ?? [];

        $setters = [
            'nom'                => 'setNom',
            'prenom'             => 'setPrenom',
            'cin'                => 'setCin',
            'telephone'          => 'setTelephone',
            'adresse'            => 'setAdresse',
            'sexe'               => 'setSexe',
            'situationFamiliale' => 'setSituationFamiliale',
            'conjoint'           => 'setConjoint',
            'nombreEnfants'      => 'setNombreEnfants',
            'poste'              => 'setPoste',
            'grade'              => 'setGrade',
            'echelle'            => 'setEchelle',
        ];

        foreach ($nouvelle as $field => $value) {
            if (isset($setters[$field]) && method_exists($employe, $setters[$field])) {
                $employe->{$setters[$field]}($value);
            }
        }
    }

    private function serializeCorrection(CorrectionDemande $c): array
    {
        return [
            'id'                    => $c->getId(),
            'typeCorrection'        => $c->getTypeCorrection(),
            'ancienneValeur'        => $c->getAncienneValeur(),
            'nouvelleValeur'        => $c->getNouvelleValeur(),
            'comparaison'           => $c->getComparaison(),
            'justification'         => $c->getJustification(),
            'commentaire'           => $c->getCommentaire(),
            'statut'                => $c->getStatut(),
            'dateCreation'          => $c->getDateCreation()?->format('c'),
            'dateTraitement'        => $c->getDateTraitement()?->format('c'),
            'motifRefus'            => $c->getMotifRefus(),
            'documentsJustificatifs'=> $c->getDocumentsJustificatifs(),
            'employe'               => [
                'id'     => $c->getEmploye()->getId(),
                'nom'    => $c->getEmploye()->getNom(),
                'prenom' => $c->getEmploye()->getPrenom(),
            ],
        ];
    }
}
