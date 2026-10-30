<?php

namespace App\Entity;

use App\Repository\HrRequestRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

/**
 * HrRequest — HR Document Requests
 *
 * Types:    Attestation de Travail | Attestation de Salaire | Demande de Congé | Renouvellement Matériel | ...
 * Statuses: attente | cours | terminees | rejetees
 * Priority: Normale | Haute | Urgente
 */
#[ORM\Entity(repositoryClass: HrRequestRepository::class)]
#[ORM\Table(name: 'hr_request')]
#[ORM\HasLifecycleCallbacks]
class HrRequest
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['request:read'])]
    private ?int $id = null;

    #[ORM\Column(length: 200)]
    #[Groups(['request:read'])]
    private ?string $title = null;

    /**
     * Subtitle / type details (e.g. "PDF • Demande urgente")
     */
    #[ORM\Column(length: 200, nullable: true)]
    #[Groups(['request:read'])]
    private ?string $sub = null;

    #[ORM\Column(type: 'text', nullable: true)]
    #[Groups(['request:read', 'request:detail'])]
    private ?string $description = null;

    /**
     * attente | cours | terminees | rejetees
     */
    #[ORM\Column(length: 20)]
    #[Groups(['request:read'])]
    private string $status = 'attente';

    /**
     * Normale | Haute | Urgente
     */
    #[ORM\Column(length: 20, options: ['default' => 'Normale'])]
    #[Groups(['request:read'])]
    private string $priority = 'Normale';

    /**
     * Denormalized owner name for display (e.g. "John Davis")
     */
    #[ORM\Column(length: 150, nullable: true)]
    #[Groups(['request:read'])]
    private ?string $owner = null;

    #[ORM\Column(length: 150, nullable: true)]
    #[Groups(['request:read'])]
    private ?string $department = null;

    /**
     * HR note added when processing the request
     */
    #[ORM\Column(type: 'text', nullable: true)]
    #[Groups(['request:detail'])]
    private ?string $note = null;

    /**
     * Unique token for the public /requests/share/:docId route
     */
    #[ORM\Column(length: 64, unique: true, nullable: true)]
    private ?string $shareToken = null;

    #[ORM\ManyToOne(targetEntity: User::class, inversedBy: 'requests')]
    #[ORM\JoinColumn(nullable: true, onDelete: 'SET NULL')]
    #[Groups(['request:detail'])]
    private ?User $ownerUser = null;

    #[ORM\Column(type: 'datetime_immutable')]
    #[Groups(['request:read'])]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    #[Groups(['request:read'])]
    private ?\DateTimeImmutable $updatedAt = null;

    public function __construct()
    {
        $this->createdAt  = new \DateTimeImmutable();
        $this->shareToken = bin2hex(random_bytes(16)); // auto-generate share token
    }

    #[ORM\PreUpdate]
    public function onPreUpdate(): void
    {
        $this->updatedAt = new \DateTimeImmutable();
    }

    // ── Computed ─────────────────────────────────────────────────────────────

    #[Groups(['request:read'])]
    public function getFormattedDate(): string
    {
        $diff = (new \DateTimeImmutable())->diff($this->createdAt);
        if ($diff->i < 60 && $diff->h === 0 && $diff->d === 0) return "Il y a {$diff->i} min";
        if ($diff->h > 0 && $diff->d === 0) return "Il y a {$diff->h}h";
        if ($diff->d === 1) return "Hier";
        return "Il y a {$diff->d}j";
    }

    // ── Getters & Setters ────────────────────────────────────────────────────

    public function getId(): ?int { return $this->id; }

    public function getTitle(): ?string { return $this->title; }
    public function setTitle(string $v): static { $this->title = $v; return $this; }

    public function getSub(): ?string { return $this->sub; }
    public function setSub(?string $v): static { $this->sub = $v; return $this; }

    public function getDescription(): ?string { return $this->description; }
    public function setDescription(?string $v): static { $this->description = $v; return $this; }

    public function getStatus(): string { return $this->status; }
    public function setStatus(string $v): static { $this->status = $v; return $this; }

    public function getPriority(): string { return $this->priority; }
    public function setPriority(string $v): static { $this->priority = $v; return $this; }

    public function getOwner(): ?string { return $this->owner; }
    public function setOwner(?string $v): static { $this->owner = $v; return $this; }

    public function getDepartment(): ?string { return $this->department; }
    public function setDepartment(?string $v): static { $this->department = $v; return $this; }

    public function getNote(): ?string { return $this->note; }
    public function setNote(?string $v): static { $this->note = $v; return $this; }

    public function getShareToken(): ?string { return $this->shareToken; }
    public function setShareToken(?string $v): static { $this->shareToken = $v; return $this; }

    public function getOwnerUser(): ?User { return $this->ownerUser; }
    public function setOwnerUser(?User $v): static { $this->ownerUser = $v; return $this; }

    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }
    public function setCreatedAt(\DateTimeImmutable $v): static { $this->createdAt = $v; return $this; }

    public function getUpdatedAt(): ?\DateTimeImmutable { return $this->updatedAt; }
    public function setUpdatedAt(?\DateTimeImmutable $v): static { $this->updatedAt = $v; return $this; }
}
