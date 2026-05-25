<?php

namespace App\Entity;

use App\Repository\FormationRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: FormationRepository::class)]
#[ORM\Table(name: 'formations')]
#[ORM\HasLifecycleCallbacks]
class Formation
{
    public const STATUT_PLANIFIEE = 'PLANIFIEE';
    public const STATUT_EN_COURS = 'EN_COURS';
    public const STATUT_TERMINEE = 'TERMINEE';
    public const STATUT_ANNULEE = 'ANNULEE';

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['formation:read'])]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    #[Assert\NotBlank]
    #[Groups(['formation:read'])]
    private ?string $titre = null;

    #[ORM\Column(type: 'text', nullable: true)]
    #[Groups(['formation:read'])]
    private ?string $description = null;

    #[ORM\Column(type: 'date')]
    #[Assert\NotNull]
    #[Groups(['formation:read'])]
    private ?\DateTimeInterface $dateDebut = null;

    #[ORM\Column(type: 'date')]
    #[Assert\NotNull]
    #[Groups(['formation:read'])]
    private ?\DateTimeInterface $dateFin = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['formation:read'])]
    private ?string $lieu = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['formation:read'])]
    private ?int $capacite = null;

    #[ORM\Column(length: 50)]
    #[Groups(['formation:read'])]
    private string $statut = self::STATUT_PLANIFIEE;

    #[ORM\ManyToMany(targetEntity: Employe::class, inversedBy: 'formations')]
    #[ORM\JoinTable(name: 'formation_participants')]
    #[Groups(['formation:read'])]
    private Collection $participants;

    #[ORM\Column]
    #[Groups(['formation:read'])]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $updatedAt = null;

    public function __construct()
    {
        $this->participants = new ArrayCollection();
    }

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

    public function getTitre(): ?string { return $this->titre; }
    public function setTitre(string $titre): static { $this->titre = $titre; return $this; }

    public function getDescription(): ?string { return $this->description; }
    public function setDescription(?string $description): static { $this->description = $description; return $this; }

    public function getDateDebut(): ?\DateTimeInterface { return $this->dateDebut; }
    public function setDateDebut(\DateTimeInterface $dateDebut): static { $this->dateDebut = $dateDebut; return $this; }

    public function getDateFin(): ?\DateTimeInterface { return $this->dateFin; }
    public function setDateFin(\DateTimeInterface $dateFin): static { $this->dateFin = $dateFin; return $this; }

    public function getLieu(): ?string { return $this->lieu; }
    public function setLieu(?string $lieu): static { $this->lieu = $lieu; return $this; }

    public function getCapacite(): ?int { return $this->capacite; }
    public function setCapacite(?int $capacite): static { $this->capacite = $capacite; return $this; }

    public function getStatut(): string { return $this->statut; }
    public function setStatut(string $statut): static { $this->statut = $statut; return $this; }

    public function getParticipants(): Collection { return $this->participants; }
    public function addParticipant(Employe $employe): static
    {
        if (!$this->participants->contains($employe)) {
            $this->participants->add($employe);
        }
        return $this;
    }
    public function removeParticipant(Employe $employe): static
    {
        $this->participants->removeElement($employe);
        return $this;
    }

    public function getCreatedAt(): ?\DateTimeImmutable { return $this->createdAt; }
    public function getUpdatedAt(): ?\DateTimeImmutable { return $this->updatedAt; }
}
