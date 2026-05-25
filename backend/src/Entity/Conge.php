<?php

namespace App\Entity;

use App\Repository\CongeRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: CongeRepository::class)]
#[ORM\Table(name: 'conges')]
#[ORM\HasLifecycleCallbacks]
class Conge
{
    public const STATUT_EN_ATTENTE = 'EN_ATTENTE';
    public const STATUT_APPROUVE_CHEF = 'APPROUVE_CHEF';
    public const STATUT_APPROUVE = 'APPROUVE';
    public const STATUT_REFUSE = 'REFUSE';

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['conge:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'conges')]
    #[ORM\JoinColumn(nullable: false)]
    #[Assert\NotNull]
    #[Groups(['conge:read'])]
    private ?Employe $employe = null;

    #[ORM\Column(type: 'date')]
    #[Assert\NotNull]
    #[Groups(['conge:read'])]
    private ?\DateTimeInterface $dateDebut = null;

    #[ORM\Column(type: 'date')]
    #[Assert\NotNull]
    #[Groups(['conge:read'])]
    private ?\DateTimeInterface $dateFin = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['conge:read'])]
    private ?string $motif = null;

    #[ORM\Column(length: 50)]
    #[Groups(['conge:read'])]
    private string $statut = self::STATUT_EN_ATTENTE;

    #[ORM\Column(type: 'text', nullable: true)]
    #[Groups(['conge:read'])]
    private ?string $commentaire = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['conge:read'])]
    private ?int $nombreJours = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['conge:read'])]
    private ?string $justificatif = null;

    #[ORM\Column(type: 'boolean')]
    #[Groups(['conge:read'])]
    private bool $signatureChef = false;

    #[ORM\Column(type: 'boolean')]
    #[Groups(['conge:read'])]
    private bool $signatureRH = false;

    #[ORM\Column(type: 'text', nullable: true)]
    #[Groups(['conge:read'])]
    private ?string $motifRefus = null;

    #[ORM\Column]
    #[Groups(['conge:read'])]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $updatedAt = null;

    #[ORM\PrePersist]
    public function onPrePersist(): void
    {
        $this->createdAt = new \DateTimeImmutable();
        $this->updatedAt = new \DateTimeImmutable();
    }

    #[ORM\PreUpdate]
    public function onPreUpdate(): void
    {
        $this->updatedAt = new \DateTimeImmutable();
    }

    public function getId(): ?int { return $this->id; }

    public function getEmploye(): ?Employe { return $this->employe; }
    public function setEmploye(?Employe $employe): static { $this->employe = $employe; return $this; }

    public function getDateDebut(): ?\DateTimeInterface { return $this->dateDebut; }
    public function setDateDebut(\DateTimeInterface $dateDebut): static { $this->dateDebut = $dateDebut; return $this; }

    public function getDateFin(): ?\DateTimeInterface { return $this->dateFin; }
    public function setDateFin(\DateTimeInterface $dateFin): static { $this->dateFin = $dateFin; return $this; }

    public function getMotif(): ?string { return $this->motif; }
    public function setMotif(?string $motif): static { $this->motif = $motif; return $this; }

    public function getStatut(): string { return $this->statut; }
    public function setStatut(string $statut): static { $this->statut = $statut; return $this; }

    public function getCommentaire(): ?string { return $this->commentaire; }
    public function setCommentaire(?string $commentaire): static { $this->commentaire = $commentaire; return $this; }

    public function getNombreJours(): ?int { return $this->nombreJours; }
    public function setNombreJours(?int $nombreJours): static { $this->nombreJours = $nombreJours; return $this; }

    public function getJustificatif(): ?string { return $this->justificatif; }
    public function setJustificatif(?string $justificatif): static { $this->justificatif = $justificatif; return $this; }

    public function isSignatureChef(): bool { return $this->signatureChef; }
    public function setSignatureChef(bool $signatureChef): static { $this->signatureChef = $signatureChef; return $this; }

    public function isSignatureRH(): bool { return $this->signatureRH; }
    public function setSignatureRH(bool $signatureRH): static { $this->signatureRH = $signatureRH; return $this; }

    public function getMotifRefus(): ?string { return $this->motifRefus; }
    public function setMotifRefus(?string $motifRefus): static { $this->motifRefus = $motifRefus; return $this; }

    public function getCreatedAt(): ?\DateTimeImmutable { return $this->createdAt; }
    public function getUpdatedAt(): ?\DateTimeImmutable { return $this->updatedAt; }
}
