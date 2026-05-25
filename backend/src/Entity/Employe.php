<?php

namespace App\Entity;

use App\Repository\EmployeRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: EmployeRepository::class)]
#[ORM\Table(name: 'employes')]
#[ORM\HasLifecycleCallbacks]
class Employe
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['employe:read', 'conge:read', 'absence:read', 'attestation:read', 'formation:read', 'notification:read', 'correction:read'])]
    private ?int $id = null;

    // Informations personnelles
    #[ORM\Column(length: 100)]
    #[Assert\NotBlank]
    #[Groups(['employe:read', 'conge:read', 'absence:read', 'attestation:read', 'notification:read', 'correction:read'])]
    private ?string $nom = null;

    #[ORM\Column(length: 100)]
    #[Assert\NotBlank]
    #[Groups(['employe:read', 'conge:read', 'absence:read', 'attestation:read', 'notification:read', 'correction:read'])]
    private ?string $prenom = null;

    #[ORM\Column(length: 20, nullable: true)]
    #[Groups(['employe:read'])]
    private ?string $cin = null;

    #[ORM\Column(length: 20, nullable: true)]
    #[Groups(['employe:read'])]
    private ?string $telephone = null;

    #[ORM\Column(type: 'text', nullable: true)]
    #[Groups(['employe:read'])]
    private ?string $adresse = null;

    #[ORM\Column(type: 'date', nullable: true)]
    #[Groups(['employe:read'])]
    private ?\DateTimeInterface $dateNaissance = null;

    #[ORM\Column(length: 10, nullable: true)]
    #[Groups(['employe:read'])]
    private ?string $sexe = null;

    #[ORM\Column(length: 50, nullable: true)]
    #[Groups(['employe:read'])]
    private ?string $situationFamiliale = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['employe:read'])]
    private ?string $photo = null;

    // Informations administratives
    #[ORM\Column(length: 50, unique: true)]
    #[Assert\NotBlank]
    #[Groups(['employe:read'])]
    private ?string $matricule = null;

    #[ORM\Column(length: 100, nullable: true)]
    #[Groups(['employe:read'])]
    private ?string $poste = null;

    #[ORM\Column(length: 100, nullable: true)]
    #[Groups(['employe:read'])]
    private ?string $grade = null;

    #[ORM\Column(length: 50, nullable: true)]
    #[Groups(['employe:read'])]
    private ?string $echelle = null;

    #[ORM\Column(type: 'date', nullable: true)]
    #[Groups(['employe:read'])]
    private ?\DateTimeInterface $dateRecrutement = null;

    #[ORM\Column(length: 50, nullable: true)]
    #[Groups(['employe:read'])]
    private ?string $statut = null;

    #[ORM\Column(type: 'decimal', precision: 10, scale: 2, nullable: true)]
    #[Groups(['employe:read'])]
    private ?string $salaire = null;

    // Informations familiales
    #[ORM\Column(length: 100, nullable: true)]
    #[Groups(['employe:read'])]
    private ?string $conjoint = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['employe:read'])]
    private ?int $nombreEnfants = null;

    // Relations
    #[ORM\OneToOne(inversedBy: 'employe')]
    #[ORM\JoinColumn(nullable: true)]
    private ?User $user = null;

    #[ORM\ManyToOne(inversedBy: 'employes')]
    #[ORM\JoinColumn(nullable: true)]
    #[Groups(['employe:read'])]
    private ?ServiceRH $service = null;

    #[ORM\OneToMany(mappedBy: 'employe', targetEntity: Affectation::class)]
    private Collection $affectations;

    #[ORM\OneToMany(mappedBy: 'employe', targetEntity: Conge::class)]
    private Collection $conges;

    #[ORM\OneToMany(mappedBy: 'employe', targetEntity: Absence::class)]
    private Collection $absences;

    #[ORM\OneToMany(mappedBy: 'employe', targetEntity: Attestation::class)]
    private Collection $attestations;

    #[ORM\ManyToMany(targetEntity: Formation::class, mappedBy: 'participants')]
    private Collection $formations;

    #[ORM\OneToMany(mappedBy: 'employe', targetEntity: Document::class)]
    private Collection $documents;

    #[ORM\OneToMany(mappedBy: 'employe', targetEntity: Notification::class)]
    private Collection $notifications;

    #[ORM\OneToMany(mappedBy: 'employe', targetEntity: CorrectionDemande::class)]
    private Collection $corrections;

    #[ORM\Column]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $updatedAt = null;

    public function __construct()
    {
        $this->affectations = new ArrayCollection();
        $this->conges = new ArrayCollection();
        $this->absences = new ArrayCollection();
        $this->attestations = new ArrayCollection();
        $this->formations = new ArrayCollection();
        $this->documents = new ArrayCollection();
        $this->notifications = new ArrayCollection();
        $this->corrections = new ArrayCollection();
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

    public function getNom(): ?string { return $this->nom; }
    public function setNom(string $nom): static { $this->nom = $nom; return $this; }

    public function getPrenom(): ?string { return $this->prenom; }
    public function setPrenom(string $prenom): static { $this->prenom = $prenom; return $this; }

    public function getCin(): ?string { return $this->cin; }
    public function setCin(?string $cin): static { $this->cin = $cin; return $this; }

    public function getTelephone(): ?string { return $this->telephone; }
    public function setTelephone(?string $telephone): static { $this->telephone = $telephone; return $this; }

    public function getAdresse(): ?string { return $this->adresse; }
    public function setAdresse(?string $adresse): static { $this->adresse = $adresse; return $this; }

    public function getDateNaissance(): ?\DateTimeInterface { return $this->dateNaissance; }
    public function setDateNaissance(?\DateTimeInterface $dateNaissance): static { $this->dateNaissance = $dateNaissance; return $this; }

    public function getSexe(): ?string { return $this->sexe; }
    public function setSexe(?string $sexe): static { $this->sexe = $sexe; return $this; }

    public function getSituationFamiliale(): ?string { return $this->situationFamiliale; }
    public function setSituationFamiliale(?string $situationFamiliale): static { $this->situationFamiliale = $situationFamiliale; return $this; }

    public function getPhoto(): ?string { return $this->photo; }
    public function setPhoto(?string $photo): static { $this->photo = $photo; return $this; }

    public function getMatricule(): ?string { return $this->matricule; }
    public function setMatricule(string $matricule): static { $this->matricule = $matricule; return $this; }

    public function getPoste(): ?string { return $this->poste; }
    public function setPoste(?string $poste): static { $this->poste = $poste; return $this; }

    public function getGrade(): ?string { return $this->grade; }
    public function setGrade(?string $grade): static { $this->grade = $grade; return $this; }

    public function getEchelle(): ?string { return $this->echelle; }
    public function setEchelle(?string $echelle): static { $this->echelle = $echelle; return $this; }

    public function getDateRecrutement(): ?\DateTimeInterface { return $this->dateRecrutement; }
    public function setDateRecrutement(?\DateTimeInterface $dateRecrutement): static { $this->dateRecrutement = $dateRecrutement; return $this; }

    public function getStatut(): ?string { return $this->statut; }
    public function setStatut(?string $statut): static { $this->statut = $statut; return $this; }

    public function getSalaire(): ?string { return $this->salaire; }
    public function setSalaire(?string $salaire): static { $this->salaire = $salaire; return $this; }

    public function getConjoint(): ?string { return $this->conjoint; }
    public function setConjoint(?string $conjoint): static { $this->conjoint = $conjoint; return $this; }

    public function getNombreEnfants(): ?int { return $this->nombreEnfants; }
    public function setNombreEnfants(?int $nombreEnfants): static { $this->nombreEnfants = $nombreEnfants; return $this; }

    public function getUser(): ?User { return $this->user; }
    public function setUser(?User $user): static { $this->user = $user; return $this; }

    public function getService(): ?ServiceRH { return $this->service; }
    public function setService(?ServiceRH $service): static { $this->service = $service; return $this; }

    public function getAffectations(): Collection { return $this->affectations; }
    public function getConges(): Collection { return $this->conges; }
    public function getAbsences(): Collection { return $this->absences; }
    public function getAttestations(): Collection { return $this->attestations; }
    public function getFormations(): Collection { return $this->formations; }
    public function getDocuments(): Collection { return $this->documents; }
    public function getNotifications(): Collection { return $this->notifications; }
    public function getCorrections(): Collection { return $this->corrections; }

    public function getCreatedAt(): ?\DateTimeImmutable { return $this->createdAt; }
    public function getUpdatedAt(): ?\DateTimeImmutable { return $this->updatedAt; }

    public function getNomComplet(): string
    {
        return $this->prenom . ' ' . $this->nom;
    }
}
