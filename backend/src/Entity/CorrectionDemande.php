<?php

namespace App\Entity;

use App\Repository\CorrectionDemandeRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: CorrectionDemandeRepository::class)]
#[ORM\Table(name: 'correction_demandes')]
#[ORM\HasLifecycleCallbacks]
class CorrectionDemande
{
    public const STATUT_EN_ATTENTE = 'EN_ATTENTE';
    public const STATUT_APPROUVEE = 'APPROUVEE';
    public const STATUT_REFUSEE = 'REFUSEE';

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['correction:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'corrections')]
    #[ORM\JoinColumn(nullable: false)]
    #[Assert\NotNull]
    #[Groups(['correction:read'])]
    private ?Employe $employe = null;

    #[ORM\Column(length: 100)]
    #[Assert\NotBlank]
    #[Groups(['correction:read'])]
    private ?string $typeCorrection = null;

    #[ORM\Column(type: 'json', nullable: true)]
    #[Groups(['correction:read'])]
    private ?array $ancienneValeur = null;

    #[ORM\Column(type: 'json', nullable: true)]
    #[Groups(['correction:read'])]
    private ?array $nouvelleValeur = null;

    #[ORM\Column(type: 'text', nullable: true)]
    #[Groups(['correction:read'])]
    private ?string $justification = null;

    #[ORM\Column(type: 'text', nullable: true)]
    #[Groups(['correction:read'])]
    private ?string $commentaire = null;

    #[ORM\Column(length: 50)]
    #[Groups(['correction:read'])]
    private string $statut = self::STATUT_EN_ATTENTE;

    #[ORM\Column]
    #[Groups(['correction:read'])]
    private ?\DateTimeImmutable $dateCreation = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['correction:read'])]
    private ?\DateTimeImmutable $dateTraitement = null;

    #[ORM\Column(type: 'text', nullable: true)]
    #[Groups(['correction:read'])]
    private ?string $motifRefus = null;

    #[ORM\Column(type: 'json', nullable: true)]
    #[Groups(['correction:read'])]
    private ?array $documentsJustificatifs = null;

    #[ORM\PrePersist]
    public function onPrePersist(): void
    {
        $this->dateCreation = new \DateTimeImmutable();
    }

    public function getId(): ?int { return $this->id; }

    public function getEmploye(): ?Employe { return $this->employe; }
    public function setEmploye(?Employe $employe): static { $this->employe = $employe; return $this; }

    public function getTypeCorrection(): ?string { return $this->typeCorrection; }
    public function setTypeCorrection(string $typeCorrection): static { $this->typeCorrection = $typeCorrection; return $this; }

    public function getAncienneValeur(): ?array { return $this->ancienneValeur; }
    public function setAncienneValeur(?array $ancienneValeur): static { $this->ancienneValeur = $ancienneValeur; return $this; }

    public function getNouvelleValeur(): ?array { return $this->nouvelleValeur; }
    public function setNouvelleValeur(?array $nouvelleValeur): static { $this->nouvelleValeur = $nouvelleValeur; return $this; }

    public function getJustification(): ?string { return $this->justification; }
    public function setJustification(?string $justification): static { $this->justification = $justification; return $this; }

    public function getCommentaire(): ?string { return $this->commentaire; }
    public function setCommentaire(?string $commentaire): static { $this->commentaire = $commentaire; return $this; }

    public function getStatut(): string { return $this->statut; }
    public function setStatut(string $statut): static { $this->statut = $statut; return $this; }

    public function getDateCreation(): ?\DateTimeImmutable { return $this->dateCreation; }
    public function setDateCreation(\DateTimeImmutable $dateCreation): static { $this->dateCreation = $dateCreation; return $this; }

    public function getDateTraitement(): ?\DateTimeImmutable { return $this->dateTraitement; }
    public function setDateTraitement(?\DateTimeImmutable $dateTraitement): static { $this->dateTraitement = $dateTraitement; return $this; }

    public function getMotifRefus(): ?string { return $this->motifRefus; }
    public function setMotifRefus(?string $motifRefus): static { $this->motifRefus = $motifRefus; return $this; }

    public function getDocumentsJustificatifs(): ?array { return $this->documentsJustificatifs; }
    public function setDocumentsJustificatifs(?array $documentsJustificatifs): static { $this->documentsJustificatifs = $documentsJustificatifs; return $this; }

    public function getComparaison(): array
    {
        $comparaison = [];
        $ancienne = $this->ancienneValeur ?? [];
        $nouvelle = $this->nouvelleValeur ?? [];
        $allKeys = array_unique(array_merge(array_keys($ancienne), array_keys($nouvelle)));
        foreach ($allKeys as $key) {
            $comparaison[$key] = [
                'ancienne' => $ancienne[$key] ?? null,
                'nouvelle' => $nouvelle[$key] ?? null,
                'modifie'  => ($ancienne[$key] ?? null) !== ($nouvelle[$key] ?? null),
            ];
        }
        return $comparaison;
    }
}
