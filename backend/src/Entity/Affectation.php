<?php

namespace App\Entity;

use App\Repository\AffectationRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: AffectationRepository::class)]
#[ORM\Table(name: 'affectations')]
#[ORM\HasLifecycleCallbacks]
class Affectation
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['affectation:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'affectations')]
    #[ORM\JoinColumn(nullable: false)]
    #[Assert\NotNull]
    #[Groups(['affectation:read'])]
    private ?Employe $employe = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: true)]
    #[Groups(['affectation:read'])]
    private ?ServiceRH $service = null;

    #[ORM\Column(length: 100, nullable: true)]
    #[Groups(['affectation:read'])]
    private ?string $poste = null;

    #[ORM\Column(type: 'date')]
    #[Assert\NotNull]
    #[Groups(['affectation:read'])]
    private ?\DateTimeInterface $dateDebut = null;

    #[ORM\Column(type: 'date', nullable: true)]
    #[Groups(['affectation:read'])]
    private ?\DateTimeInterface $dateFin = null;

    #[ORM\Column]
    #[Groups(['affectation:read'])]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\PrePersist]
    public function onPrePersist(): void
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?int { return $this->id; }

    public function getEmploye(): ?Employe { return $this->employe; }
    public function setEmploye(?Employe $employe): static { $this->employe = $employe; return $this; }

    public function getService(): ?ServiceRH { return $this->service; }
    public function setService(?ServiceRH $service): static { $this->service = $service; return $this; }

    public function getPoste(): ?string { return $this->poste; }
    public function setPoste(?string $poste): static { $this->poste = $poste; return $this; }

    public function getDateDebut(): ?\DateTimeInterface { return $this->dateDebut; }
    public function setDateDebut(\DateTimeInterface $dateDebut): static { $this->dateDebut = $dateDebut; return $this; }

    public function getDateFin(): ?\DateTimeInterface { return $this->dateFin; }
    public function setDateFin(?\DateTimeInterface $dateFin): static { $this->dateFin = $dateFin; return $this; }

    public function getCreatedAt(): ?\DateTimeImmutable { return $this->createdAt; }
}
