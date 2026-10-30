<?php

namespace App\Entity;

use App\Repository\LeaveRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

/**
 * Leave — Employee Absence & Leave Records
 *
 * Types:    Congé Annuel | Maladie | Télétravail | Exceptionnel
 * Statuses: En attente | Approuvé | Refusé
 */
#[ORM\Entity(repositoryClass: LeaveRepository::class)]
#[ORM\Table(name: 'employee_leave')]
#[ORM\HasLifecycleCallbacks]
class Leave
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['leave:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: User::class, inversedBy: 'leaves')]
    #[ORM\JoinColumn(nullable: true, onDelete: 'SET NULL')]
    private ?User $employee = null;

    /**
     * Denormalized employee name for display
     */
    #[ORM\Column(length: 150)]
    #[Groups(['leave:read'])]
    private ?string $name = null;

    #[ORM\Column(length: 150, nullable: true)]
    #[Groups(['leave:read'])]
    private ?string $department = null;

    /**
     * Congé Annuel | Maladie | Télétravail | Exceptionnel
     */
    #[ORM\Column(length: 50)]
    #[Groups(['leave:read'])]
    private ?string $type = null;

    #[ORM\Column(type: 'date')]
    #[Groups(['leave:read'])]
    private ?\DateTimeInterface $startDate = null;

    #[ORM\Column(type: 'date')]
    #[Groups(['leave:read'])]
    private ?\DateTimeInterface $endDate = null;

    /**
     * Human-readable duration string e.g. "5 jours"
     */
    #[ORM\Column(length: 30, nullable: true)]
    #[Groups(['leave:read'])]
    private ?string $duration = null;

    /**
     * En attente | Approuvé | Refusé
     */
    #[ORM\Column(length: 20, options: ['default' => 'En attente'])]
    #[Groups(['leave:read'])]
    private string $status = 'En attente';

    #[ORM\Column(type: 'text', nullable: true)]
    #[Groups(['leave:detail'])]
    private ?string $motif = null;

    /**
     * Name of the manager/HR who approved
     */
    #[ORM\Column(length: 150, nullable: true)]
    #[Groups(['leave:read'])]
    private ?string $approvedBy = null;

    #[ORM\Column(type: 'text', nullable: true)]
    #[Groups(['leave:detail'])]
    private ?string $rejectionReason = null;

    #[ORM\Column(type: 'datetime_immutable')]
    #[Groups(['leave:read'])]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    #[Groups(['leave:read'])]
    private ?\DateTimeImmutable $updatedAt = null;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    #[ORM\PreUpdate]
    public function onPreUpdate(): void
    {
        $this->updatedAt = new \DateTimeImmutable();
    }

    // ── Computed ─────────────────────────────────────────────────────────────

    /**
     * Returns formatted period string like "15 Oct - 20 Oct"
     */
    #[Groups(['leave:read'])]
    public function getPeriod(): string
    {
        if (!$this->startDate || !$this->endDate) return '';
        $fmt = fn(\DateTimeInterface $d) => $d->format('d M');
        return $fmt($this->startDate) . ' - ' . $fmt($this->endDate);
    }

    /**
     * Returns initials from name
     */
    #[Groups(['leave:read'])]
    public function getInitials(): string
    {
        $parts = explode(' ', trim($this->name ?? ''));
        return strtoupper(implode('', array_map(fn($p) => substr($p, 0, 1), $parts)));
    }

    // ── Getters & Setters ────────────────────────────────────────────────────

    public function getId(): ?int { return $this->id; }

    public function getEmployee(): ?User { return $this->employee; }
    public function setEmployee(?User $v): static { $this->employee = $v; return $this; }

    public function getName(): ?string { return $this->name; }
    public function setName(string $v): static { $this->name = $v; return $this; }

    public function getDepartment(): ?string { return $this->department; }
    public function setDepartment(?string $v): static { $this->department = $v; return $this; }

    public function getType(): ?string { return $this->type; }
    public function setType(string $v): static { $this->type = $v; return $this; }

    public function getStartDate(): ?\DateTimeInterface { return $this->startDate; }
    public function setStartDate(\DateTimeInterface $v): static { $this->startDate = $v; return $this; }

    public function getEndDate(): ?\DateTimeInterface { return $this->endDate; }
    public function setEndDate(\DateTimeInterface $v): static { $this->endDate = $v; return $this; }

    public function getDuration(): ?string { return $this->duration; }
    public function setDuration(?string $v): static { $this->duration = $v; return $this; }

    public function getStatus(): string { return $this->status; }
    public function setStatus(string $v): static { $this->status = $v; return $this; }

    public function getMotif(): ?string { return $this->motif; }
    public function setMotif(?string $v): static { $this->motif = $v; return $this; }

    public function getApprovedBy(): ?string { return $this->approvedBy; }
    public function setApprovedBy(?string $v): static { $this->approvedBy = $v; return $this; }

    public function getRejectionReason(): ?string { return $this->rejectionReason; }
    public function setRejectionReason(?string $v): static { $this->rejectionReason = $v; return $this; }

    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }
    public function setCreatedAt(\DateTimeImmutable $v): static { $this->createdAt = $v; return $this; }

    public function getUpdatedAt(): ?\DateTimeImmutable { return $this->updatedAt; }
    public function setUpdatedAt(?\DateTimeImmutable $v): static { $this->updatedAt = $v; return $this; }
}
