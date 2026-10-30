<?php

namespace App\Entity;

use App\Repository\EmployeeRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: EmployeeRepository::class)]
#[ORM\HasLifecycleCallbacks]
class Employee
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['employee:read'])]
    private ?int $id = null;

    #[ORM\Column(length: 100)]
    #[Groups(['employee:read', 'leave:read', 'compliance:read'])]
    private ?string $firstName = null;

    #[ORM\Column(length: 100)]
    #[Groups(['employee:read', 'leave:read', 'compliance:read'])]
    private ?string $lastName = null;

    #[ORM\Column(length: 180, unique: true)]
    #[Groups(['employee:read', 'compliance:read'])]
    private ?string $email = null;

    /**
     * Job title / function (e.g. "Senior Web Developer")
     */
    #[ORM\Column(length: 150, nullable: true)]
    #[Groups(['employee:read'])]
    private ?string $role = null;

    #[ORM\Column(length: 150, nullable: true)]
    #[Groups(['employee:read', 'leave:read'])]
    private ?string $department = null;

    /**
     * CDI | CDD | Stage | Freelance
     */
    #[ORM\Column(length: 50, nullable: true)]
    #[Groups(['employee:read'])]
    private ?string $contractType = null;

    #[ORM\Column(length: 30, nullable: true)]
    #[Groups(['employee:read'])]
    private ?string $phone = null;

    /**
     * Base monthly salary in MAD
     */
    #[ORM\Column(type: 'decimal', precision: 10, scale: 2, nullable: true)]
    #[Groups(['employee:read'])]
    private ?string $baseSalary = null;

    #[ORM\Column(length: 7, nullable: true)]
    #[Groups(['employee:read'])]
    private ?string $avatarBg = null;   // hex color e.g. "2563EB"

    #[ORM\Column(type: 'date', nullable: true)]
    #[Groups(['employee:read'])]
    private ?\DateTimeInterface $hireDate = null;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    private ?\DateTimeImmutable $updatedAt = null;

    // Relations
    #[ORM\OneToMany(mappedBy: 'employee', targetEntity: ComplianceRecord::class, cascade: ['remove'])]
    private Collection $complianceRecords;

    public function __construct()
    {
        $this->createdAt        = new \DateTimeImmutable();
        $this->complianceRecords = new ArrayCollection();
    }

    #[ORM\PreUpdate]
    public function onPreUpdate(): void
    {
        $this->updatedAt = new \DateTimeImmutable();
    }

    // ── Computed ─────────────────────────────────────────────────────────────

    #[Groups(['employee:read', 'leave:read', 'compliance:read', 'request:read'])]
    public function getFullName(): string
    {
        return trim("{$this->firstName} {$this->lastName}");
    }

    #[Groups(['employee:read'])]
    public function getInitials(): string
    {
        return strtoupper(
            substr($this->firstName ?? '', 0, 1) .
            substr($this->lastName  ?? '', 0, 1)
        );
    }

    // ── Getters & Setters ────────────────────────────────────────────────────

    public function getId(): ?int { return $this->id; }

    public function getFirstName(): ?string { return $this->firstName; }
    public function setFirstName(string $v): static { $this->firstName = $v; return $this; }

    public function getLastName(): ?string { return $this->lastName; }
    public function setLastName(string $v): static { $this->lastName = $v; return $this; }

    public function getEmail(): ?string { return $this->email; }
    public function setEmail(string $v): static { $this->email = $v; return $this; }

    public function getRole(): ?string { return $this->role; }
    public function setRole(?string $v): static { $this->role = $v; return $this; }

    public function getDepartment(): ?string { return $this->department; }
    public function setDepartment(?string $v): static { $this->department = $v; return $this; }

    public function getContractType(): ?string { return $this->contractType; }
    public function setContractType(?string $v): static { $this->contractType = $v; return $this; }

    public function getPhone(): ?string { return $this->phone; }
    public function setPhone(?string $v): static { $this->phone = $v; return $this; }

    public function getBaseSalary(): ?string { return $this->baseSalary; }
    public function setBaseSalary(?string $v): static { $this->baseSalary = $v; return $this; }

    public function getAvatarBg(): ?string { return $this->avatarBg; }
    public function setAvatarBg(?string $v): static { $this->avatarBg = $v; return $this; }

    public function getHireDate(): ?\DateTimeInterface { return $this->hireDate; }
    public function setHireDate(?\DateTimeInterface $v): static { $this->hireDate = $v; return $this; }

    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }
    public function getUpdatedAt(): ?\DateTimeImmutable { return $this->updatedAt; }

    public function getComplianceRecords(): Collection { return $this->complianceRecords; }
}
