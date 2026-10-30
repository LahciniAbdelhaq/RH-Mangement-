<?php

namespace App\Entity;

use App\Repository\ComplianceRecordRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

/**
 * ComplianceRecord — Mandatory Training & Regulatory Compliance
 *
 * Tracks whether an employee has completed a required training.
 * Statuses: Non Conforme | En Cours | Conforme
 */
#[ORM\Entity(repositoryClass: ComplianceRecordRepository::class)]
#[ORM\Table(name: 'compliance_record')]
#[ORM\HasLifecycleCallbacks]
class ComplianceRecord
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['compliance:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Employee::class, inversedBy: 'complianceRecords')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    #[Groups(['compliance:read'])]
    private ?Employee $employee = null;

    /**
     * e.g. "Formation Anti-Harcèlement" | "Cybersécurité"
     */
    #[ORM\Column(length: 200)]
    #[Groups(['compliance:read'])]
    private ?string $requirement = null;

    /**
     * Non Conforme | En Cours | Conforme
     */
    #[ORM\Column(length: 30, options: ['default' => 'Non Conforme'])]
    #[Groups(['compliance:read'])]
    private string $status = 'Non Conforme';

    #[ORM\Column(type: 'date', nullable: true)]
    #[Groups(['compliance:read'])]
    private ?\DateTimeInterface $deadline = null;

    #[ORM\Column(type: 'date', nullable: true)]
    #[Groups(['compliance:read'])]
    private ?\DateTimeInterface $completedAt = null;

    #[ORM\Column(type: 'text', nullable: true)]
    #[Groups(['compliance:read'])]
    private ?string $notes = null;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $createdAt;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    // ── Computed ─────────────────────────────────────────────────────────────

    #[Groups(['compliance:read'])]
    public function isLate(): bool
    {
        if ($this->status === 'Conforme') return false;
        if (!$this->deadline) return false;
        return $this->deadline < new \DateTimeImmutable('today');
    }

    // ── Getters & Setters ────────────────────────────────────────────────────

    public function getId(): ?int { return $this->id; }

    public function getEmployee(): ?Employee { return $this->employee; }
    public function setEmployee(?Employee $v): static { $this->employee = $v; return $this; }

    public function getRequirement(): ?string { return $this->requirement; }
    public function setRequirement(string $v): static { $this->requirement = $v; return $this; }

    public function getStatus(): string { return $this->status; }
    public function setStatus(string $v): static { $this->status = $v; return $this; }

    public function getDeadline(): ?\DateTimeInterface { return $this->deadline; }
    public function setDeadline(?\DateTimeInterface $v): static { $this->deadline = $v; return $this; }

    public function getCompletedAt(): ?\DateTimeInterface { return $this->completedAt; }
    public function setCompletedAt(?\DateTimeInterface $v): static { $this->completedAt = $v; return $this; }

    public function getNotes(): ?string { return $this->notes; }
    public function setNotes(?string $v): static { $this->notes = $v; return $this; }

    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }

    public function countByStatus(string $status): int
    {
        return 0; // implemented in repository
    }
}


// ════════════════════════════════════════════════════════════════════════════


namespace App\Entity;

use App\Repository\NotificationRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

/**
 * Notification — Per-user notification system
 *
 * Types:      request | alert | info
 * Categories: conge | document | system | paie | absence
 */
#[ORM\Entity(repositoryClass: NotificationRepository::class)]
#[ORM\Table(name: 'notification')]
class Notification
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['notification:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: User::class, inversedBy: 'notifications')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?User $recipient = null;

    #[ORM\Column(length: 200)]
    #[Groups(['notification:read'])]
    private ?string $title = null;

    #[ORM\Column(type: 'text')]
    #[Groups(['notification:read'])]
    private ?string $message = null;

    /**
     * request | alert | info
     */
    #[ORM\Column(length: 20, options: ['default' => 'info'])]
    #[Groups(['notification:read'])]
    private string $type = 'info';

    /**
     * conge | document | system | paie | absence
     */
    #[ORM\Column(length: 30, nullable: true)]
    #[Groups(['notification:read'])]
    private ?string $category = null;

    #[ORM\Column(options: ['default' => true])]
    #[Groups(['notification:read'])]
    private bool $unread = true;

    #[ORM\Column(type: 'datetime_immutable')]
    #[Groups(['notification:read'])]
    private \DateTimeImmutable $createdAt;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?int { return $this->id; }

    public function getRecipient(): ?User { return $this->recipient; }
    public function setRecipient(?User $v): static { $this->recipient = $v; return $this; }

    public function getTitle(): ?string { return $this->title; }
    public function setTitle(string $v): static { $this->title = $v; return $this; }

    public function getMessage(): ?string { return $this->message; }
    public function setMessage(string $v): static { $this->message = $v; return $this; }

    public function getType(): string { return $this->type; }
    public function setType(string $v): static { $this->type = $v; return $this; }

    public function getCategory(): ?string { return $this->category; }
    public function setCategory(?string $v): static { $this->category = $v; return $this; }

    public function isUnread(): bool { return $this->unread; }
    public function setUnread(bool $v): static { $this->unread = $v; return $this; }

    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }
}


// ════════════════════════════════════════════════════════════════════════════


namespace App\Entity;

use App\Repository\AuditLogRepository;
use Doctrine\ORM\Mapping as ORM;

/**
 * AuditLog — System activity trail
 *
 * Replaces the localStorage logSystemActivity() from rbac.js.
 * Stores every user action with timestamp for the Settings > Audit page.
 */
#[ORM\Entity(repositoryClass: AuditLogRepository::class)]
#[ORM\Table(name: 'audit_log')]
class AuditLog
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    /**
     * Short action label e.g. "Connexion" | "Création d'employé" | "Suppression d'employé"
     */
    #[ORM\Column(length: 100)]
    private ?string $action = null;

    #[ORM\Column(length: 150, nullable: true)]
    private ?string $userName = null;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $details = null;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $timestamp;

    public function __construct()
    {
        $this->timestamp = new \DateTimeImmutable();
    }

    // ── Static factory ────────────────────────────────────────────────────────

    public static function create(string $action, ?string $userName, ?string $details = null): self
    {
        $log = new self();
        $log->action   = $action;
        $log->userName = $userName;
        $log->details  = $details;
        return $log;
    }

    // ── Getters ───────────────────────────────────────────────────────────────

    public function getId(): ?int { return $this->id; }
    public function getAction(): ?string { return $this->action; }
    public function setAction(string $v): static { $this->action = $v; return $this; }
    public function getUserName(): ?string { return $this->userName; }
    public function setUserName(?string $v): static { $this->userName = $v; return $this; }
    public function getDetails(): ?string { return $this->details; }
    public function setDetails(?string $v): static { $this->details = $v; return $this; }
    public function getTimestamp(): \DateTimeImmutable { return $this->timestamp; }
}
