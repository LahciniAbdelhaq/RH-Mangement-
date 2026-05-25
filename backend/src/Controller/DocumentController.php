<?php

namespace App\Controller;

use App\Entity\Document;
use App\Entity\User;
use App\Repository\DocumentRepository;
use App\Repository\EmployeRepository;
use App\Service\ApiResponseService;
use App\Service\UploadService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\ResponseHeaderBag;
use Symfony\Component\HttpKernel\KernelInterface;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/documents')]
class DocumentController extends AbstractController
{
    public function __construct(
        private readonly ApiResponseService $apiResponse,
        private readonly EntityManagerInterface $em,
        private readonly DocumentRepository $documentRepo,
        private readonly UploadService $uploadService,
        private readonly KernelInterface $kernel,
    ) {}

    #[Route('', name: 'api_documents_list', methods: ['GET'])]
    public function index(Request $request, #[CurrentUser] ?User $user): JsonResponse
    {
        if ($this->isGranted('ROLE_AGENT_RH')) {
            $employeId = $request->query->get('employe_id');
            $docs = $employeId
                ? $this->documentRepo->findBy(['employe' => $employeId])
                : $this->documentRepo->findAll();
        } else {
            $employe = $user?->getEmploye();
            if (!$employe) {
                return $this->apiResponse->success([], 'Aucun document');
            }
            $docs = $this->documentRepo->findBy(['employe' => $employe]);
        }

        return $this->apiResponse->success($docs, 'Liste des documents', ['document:read']);
    }

    #[Route('/upload', name: 'api_documents_upload', methods: ['POST'])]
    public function upload(Request $request, #[CurrentUser] ?User $user, EmployeRepository $employeRepo): JsonResponse
    {
        $file = $request->files->get('file');
        if (!$file) {
            return $this->apiResponse->error('Aucun fichier fourni');
        }

        $employe = null;
        if ($this->isGranted('ROLE_AGENT_RH') && $request->request->has('employe_id')) {
            $employe = $employeRepo->find($request->request->get('employe_id'));
        } else {
            $employe = $user?->getEmploye();
        }

        if (!$employe) {
            return $this->apiResponse->error('Profil employé introuvable', 403);
        }

        try {
            $path = $this->uploadService->upload($file, 'documents/' . $employe->getId());
        } catch (\InvalidArgumentException $e) {
            return $this->apiResponse->error($e->getMessage());
        }

        $document = new Document();
        $document->setEmploye($employe);
        $document->setNom($request->request->get('nom') ?? $file->getClientOriginalName());
        $document->setType($request->request->get('type') ?? Document::TYPE_AUTRE);
        $document->setPath($path);
        $document->setMimeType($file->getMimeType());
        $document->setTaille($file->getSize());

        $this->em->persist($document);
        $this->em->flush();

        return $this->apiResponse->success($document, 'Document uploadé', 201, ['document:read']);
    }

    #[Route('/{id}/download', name: 'api_documents_download', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function download(int $id): BinaryFileResponse
    {
        $document = $this->documentRepo->find($id);
        if (!$document) {
            throw $this->createNotFoundException('Document introuvable');
        }

        $fullPath = $this->kernel->getProjectDir() . '/public/uploads/' . $document->getPath();
        if (!file_exists($fullPath)) {
            throw $this->createNotFoundException('Fichier introuvable');
        }

        return $this->file($fullPath, $document->getNom(), ResponseHeaderBag::DISPOSITION_INLINE);
    }

    #[Route('/{id}', name: 'api_documents_delete', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    public function delete(int $id, #[CurrentUser] ?User $user): JsonResponse
    {
        $document = $this->documentRepo->find($id);
        if (!$document) {
            return $this->apiResponse->notFound('Document introuvable');
        }

        $isRH = $this->isGranted('ROLE_AGENT_RH');
        $isOwner = $document->getEmploye()->getId() === $user?->getEmploye()?->getId();

        if (!$isRH && !$isOwner) {
            return $this->apiResponse->forbidden();
        }

        $this->uploadService->delete($document->getPath());
        $this->em->remove($document);
        $this->em->flush();

        return $this->apiResponse->success(null, 'Document supprimé');
    }
}
