<?php

namespace App\Service;

use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpKernel\KernelInterface;

class UploadService
{
    private string $uploadDir;

    public function __construct(KernelInterface $kernel)
    {
        $this->uploadDir = $kernel->getProjectDir() . '/public/uploads';
    }

    public function upload(UploadedFile $file, string $subDir = 'documents'): string
    {
        $allowedMimes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
        if (!in_array($file->getMimeType(), $allowedMimes)) {
            throw new \InvalidArgumentException('Type de fichier non autorisé. Formats acceptés : PDF, JPG, PNG.');
        }

        $maxSize = 10 * 1024 * 1024; // 10MB
        if ($file->getSize() > $maxSize) {
            throw new \InvalidArgumentException('Fichier trop volumineux. Taille maximale : 10 Mo.');
        }

        $dir = $this->uploadDir . '/' . $subDir;
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        $extension = $file->guessExtension() ?? 'bin';
        $filename = uniqid('doc_', true) . '.' . $extension;

        $file->move($dir, $filename);

        return $subDir . '/' . $filename;
    }

    public function delete(string $path): void
    {
        $fullPath = $this->uploadDir . '/' . $path;
        if (file_exists($fullPath)) {
            unlink($fullPath);
        }
    }
}
