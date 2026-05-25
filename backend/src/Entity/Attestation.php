<?php

namespace App\Entity;

use App\Repository\AttestationRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: AttestationRepository::class)]
#[ORM\Table(name: 'attestations')]
#[ORM\HasLifecycleCallbacks]
class Attestation
{
    public const TYPE_TRAVAIL = 'travail';
    public const TYPE_SALAIRE = 'salaire';
    public const TYPE_ADMINISTRATIF = 'administratif';

    public const STATUT_EN_ATTENTE = 'EN_ATTENTE';
    public const STATUT_GENEREE = 'GENEREE';
    public const STATUT_SIGNEE = 'SIGNEE';
    public const STATUT_REFUSEE = 'REFUSEE';

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['attestation:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'attestations')]
    #[ORM\JoinColumn(nullable: false)]
    #[Assert\NotNull]
    #[Groups(['attestation:read'])]
    private ?Employe $employe = null;

    #[ORM\Column(length: 50)]
    #[Assert\NotBlank]
    #[Assert\Choice(choices: [self::TYPE_TRAVAIL, self::TYPE_SALAIRE, self::TYPE_ADMINISTRATIF])]
    #[Groups(['attestation:read'])]
    private ?string $type = null;

    #[ORM\Column(length: 50)]
    #[Groups(['attestation:read'])]
    private string $statut = self::STATUT_EN_ATTENTE;

    #[ORM\Column]
    #[Groups(['attestation:read'])]
    private ?\DateTimeImmutable $dateDemande = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['attestation:read'])]
    private ?\DateTimeImmutable $dateGeneration = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['attestation:read'])]
    private ?string $pdfPath = null;

    #[ORM\Column(type: 'boolean')]
    #[Groups(['attestation:read'])]
    private bool $signatureChef = false;

    #[ORM\Column(type: 'boolean')]
    #[Groups(['attestation:read'])]
    private bool $signatureRH = false;

    #[ORM\PrePersist]
    public function onPrePersist(): void
    {
        $this->dateDemande = new \DateTimeImmutable();
    }

    public function getId(): ?int { return $this->id; }

    public function getEmploye(): ?Employe { return $this->employe; }
    public function setEmploye(?Employe $employe): static { $this->employe = $employe; return $this; }

    public function getType(): ?string { return $this->type; }
    public function setType(string $type): static { $this->type = $type; return $this; }

    public function getStatut(): string { return $this->statut; }
    public function setStatut(string $statut): static { $this->statut = $statut; return $this; }

    public function getDateDemande(): ?\DateTimeImmutable { return $this->dateDemande; }
    public function setDateDemande(\DateTimeImmutable $dateDemande): static { $this->dateDemande = $dateDemande; return $this; }

    public function getDateGeneration(): ?\DateTimeImmutable { return $this->dateGeneration; }
    public function setDateGeneration(?\DateTimeImmutable $dateGeneration): static { $this->dateGeneration = $dateGeneration; return $this; }

    public function getPdfPath(): ?string { return $this->pdfPath; }
    public function setPdfPath(?string $pdfPath): static { $this->pdfPath = $pdfPath; return $this; }

    public function isSignatureChef(): bool { return $this->signatureChef; }
    public function setSignatureChef(bool $signatureChef): static { $this->signatureChef = $signatureChef; return $this; }

    public function isSignatureRH(): bool { return $this->signatureRH; }
    public function setSignatureRH(bool $signatureRH): static { $this->signatureRH = $signatureRH; return $this; }
}
