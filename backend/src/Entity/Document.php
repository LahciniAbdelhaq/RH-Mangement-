<?php

namespace App\Entity;

use App\Repository\DocumentRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: DocumentRepository::class)]
#[ORM\Table(name: 'documents')]
#[ORM\HasLifecycleCallbacks]
class Document
{
    public const TYPE_CIN = 'CIN';
    public const TYPE_DIPLOME = 'DIPLOME';
    public const TYPE_DECISION = 'DECISION';
    public const TYPE_ARRETE = 'ARRETE';
    public const TYPE_JUSTIFICATIF = 'JUSTIFICATIF';
    public const TYPE_CONTRAT = 'CONTRAT';
    public const TYPE_AFFECTATION = 'AFFECTATION';
    public const TYPE_CONGE = 'CONGE';
    public const TYPE_AUTRE = 'AUTRE';

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['document:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'documents')]
    #[ORM\JoinColumn(nullable: false)]
    #[Assert\NotNull]
    #[Groups(['document:read'])]
    private ?Employe $employe = null;

    #[ORM\Column(length: 255)]
    #[Assert\NotBlank]
    #[Groups(['document:read'])]
    private ?string $nom = null;

    #[ORM\Column(length: 50)]
    #[Groups(['document:read'])]
    private ?string $type = null;

    #[ORM\Column(length: 255)]
    #[Groups(['document:read'])]
    private ?string $path = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['document:read'])]
    private ?string $mimeType = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['document:read'])]
    private ?int $taille = null;

    #[ORM\Column]
    #[Groups(['document:read'])]
    private ?\DateTimeImmutable $uploadedAt = null;

    #[ORM\PrePersist]
    public function onPrePersist(): void
    {
        $this->uploadedAt = new \DateTimeImmutable();
    }

    public function getId(): ?int { return $this->id; }

    public function getEmploye(): ?Employe { return $this->employe; }
    public function setEmploye(?Employe $employe): static { $this->employe = $employe; return $this; }

    public function getNom(): ?string { return $this->nom; }
    public function setNom(string $nom): static { $this->nom = $nom; return $this; }

    public function getType(): ?string { return $this->type; }
    public function setType(string $type): static { $this->type = $type; return $this; }

    public function getPath(): ?string { return $this->path; }
    public function setPath(string $path): static { $this->path = $path; return $this; }

    public function getMimeType(): ?string { return $this->mimeType; }
    public function setMimeType(?string $mimeType): static { $this->mimeType = $mimeType; return $this; }

    public function getTaille(): ?int { return $this->taille; }
    public function setTaille(?int $taille): static { $this->taille = $taille; return $this; }

    public function getUploadedAt(): ?\DateTimeImmutable { return $this->uploadedAt; }
}
