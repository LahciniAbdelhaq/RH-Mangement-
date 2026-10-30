<?php

namespace App\Entity;

use App\Repository\UserRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: UserRepository::class)]
#[ORM\Table(name: '`user`')]
#[ORM\HasLifecycleCallbacks]
class User implements UserInterface, PasswordAuthenticatedUserInterface
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['user:read', 'employee:read', 'leave:read', 'request:read'])]
    private ?int $id = null;

    #[ORM\Column(length: 100)]
    #[Groups(['user:read', 'employee:read'])]
    private ?string $firstName = null;

    #[ORM\Column(length: 100)]
    #[Groups(['user:read', 'employee:read'])]
    private ?string $lastName = null;

    #[ORM\Column(length: 180, unique: true)]
    #[Groups(['user:read', 'employee:read'])]
    private ?string $email = null;

    #[ORM\Column]
    private array $roles = [];

    #[ORM\Column]
    private ?string $password = null;

    /**
     * HR Role: HR_MANAGER | HR_AGENT | EMPLOYEE | DEPARTMENT_MANAGER | INTERIM_MANAGER
     */
    #[ORM\Column(length: 50)]
    #[Groups(['user:read'])]
    private string $hrRole = 'EMPLOYEE';

    #[ORM\Column(length: 150, nullable: true)]
    #[Groups(['user:read'])]
    private ?string $title = null;

    #[ORM\Column(length: 150, nullable: true)]
    #[Groups(['user:read', 'employee:read', 'leave:read'])]
    private ?string $department = null;

    #[ORM\Column(length: 30, nullable: true)]
    #[Groups(['user:read'])]
    private ?string $phone = null;

    #[ORM\Column(length: 200, nullable: true)]
    #[Groups(['user:read'])]
    private ?string $location = null;

    #[ORM\Column(length: 50, nullable: true)]
    #[Groups(['user:read'])]
    private ?string $contractType = null;

    #[ORM\Column(type: 'date', nullable: true)]
    #[Groups(['user:read'])]
    private ?\DateTimeInterface $hireDate = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['user:read'])]
    private ?string $avatar = null;

    /**
     * For INTERIM_MANAGER: date when the interim role expires, reverting to EMPLOYEE.
     */
    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    #[Groups(['user:read'])]
    private ?\DateTimeImmutable $interimUntil = null;

    #[ORM\Column(type: 'smallint', options: ['default' => 0])]
    #[Groups(['user:read'])]
    private int $annualLeavesUsed = 0;

    #[ORM\Column(type: 'smallint', options: ['default' => 22])]
    #[Groups(['user:read'])]
    private int $annualLeavesTotal = 22;

    #[ORM\Column(type: 'smallint', options: ['default' => 0])]
    #[Groups(['user:read'])]
    private int $sickLeavesUsed = 0;

    #[ORM\Column(type: 'smallint', options: ['default' => 8])]
    #[Groups(['user:read'])]
    private int $sickLeavesTotal = 8;

    #[ORM\Column(type: 'datetime_immutable')]
    #[Groups(['user:read'])]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    private ?\DateTimeImmutable $updatedAt = null;

    // Relations
    #[ORM\OneToMany(mappedBy: 'ownerUser', targetEntity: HrRequest::class)]
    private Collection $requests;

    #[ORM\OneToMany(mappedBy: 'employee', targetEntity: Leave::class)]
    private Collection $leaves;

    #[ORM\OneToMany(mappedBy: 'recipient', targetEntity: Notification::class)]
    private Collection $notifications;

    public function __construct()
    {
        $this->createdAt   = new \DateTimeImmutable();
        $this->roles       = ['ROLE_USER'];
        $this->requests    = new ArrayCollection();
        $this->leaves      = new ArrayCollection();
        $this->notifications = new ArrayCollection();
    }

    // ── Lifecycle ────────────────────────────────────────────────────────────

    #[ORM\PreUpdate]
    public function onPreUpdate(): void
    {
        $this->updatedAt = new \DateTimeImmutable();
    }

    // ── Computed ─────────────────────────────────────────────────────────────

    #[Groups(['user:read', 'employee:read', 'leave:read', 'request:read'])]
    public function getFullName(): string
    {
        return trim("{$this->firstName} {$this->lastName}");
    }

    /**
     * Returns the effective role, downgrading INTERIM_MANAGER to EMPLOYEE if expired.
     */
    #[Groups(['user:read'])]
    public function getEffectiveHrRole(): string
    {
        if ($this->hrRole === 'INTERIM_MANAGER' && $this->interimUntil !== null) {
            if ($this->interimUntil < new \DateTimeImmutable()) {
                return 'EMPLOYEE';
            }
        }
        return $this->hrRole;
    }

    // ── UserInterface ─────────────────────────────────────────────────────────

    public function getUserIdentifier(): string { return (string) $this->email; }

    public function getRoles(): array
    {
        $roles   = $this->roles;
        $roles[] = 'ROLE_USER';

        // Map HR roles to Symfony security roles
        $roles[] = match ($this->getEffectiveHrRole()) {
            'HR_MANAGER'         => 'ROLE_HR_MANAGER',
            'HR_AGENT'           => 'ROLE_HR_AGENT',
            'DEPARTMENT_MANAGER' => 'ROLE_DEPARTMENT_MANAGER',
            'INTERIM_MANAGER'    => 'ROLE_INTERIM_MANAGER',
            default              => 'ROLE_EMPLOYEE',
        };

        return array_unique($roles);
    }

    public function eraseCredentials(): void {}

    // ── Getters & Setters ────────────────────────────────────────────────────

    public function getId(): ?int { return $this->id; }

    public function getFirstName(): ?string { return $this->firstName; }
    public function setFirstName(string $v): static { $this->firstName = $v; return $this; }

    public function getLastName(): ?string { return $this->lastName; }
    public function setLastName(string $v): static { $this->lastName = $v; return $this; }

    public function getEmail(): ?string { return $this->email; }
    public function setEmail(string $v): static { $this->email = $v; return $this; }

    public function getPassword(): ?string { return $this->password; }
    public function setPassword(string $v): static { $this->password = $v; return $this; }

    public function setRoles(array $v): static { $this->roles = $v; return $this; }

    public function getHrRole(): string { return $this->hrRole; }
    public function setHrRole(string $v): static { $this->hrRole = $v; return $this; }

    public function getTitle(): ?string { return $this->title; }
    public function setTitle(?string $v): static { $this->title = $v; return $this; }

    public function getDepartment(): ?string { return $this->department; }
    public function setDepartment(?string $v): static { $this->department = $v; return $this; }

    public function getPhone(): ?string { return $this->phone; }
    public function setPhone(?string $v): static { $this->phone = $v; return $this; }

    public function getLocation(): ?string { return $this->location; }
    public function setLocation(?string $v): static { $this->location = $v; return $this; }

    public function getContractType(): ?string { return $this->contractType; }
    public function setContractType(?string $v): static { $this->contractType = $v; return $this; }

    public function getHireDate(): ?\DateTimeInterface { return $this->hireDate; }
    public function setHireDate(?\DateTimeInterface $v): static { $this->hireDate = $v; return $this; }

    public function getAvatar(): ?string { return $this->avatar; }
    public function setAvatar(?string $v): static { $this->avatar = $v; return $this; }

    public function getInterimUntil(): ?\DateTimeImmutable { return $this->interimUntil; }
    public function setInterimUntil(?\DateTimeImmutable $v): static { $this->interimUntil = $v; return $this; }

    public function getAnnualLeavesUsed(): int { return $this->annualLeavesUsed; }
    public function setAnnualLeavesUsed(int $v): static { $this->annualLeavesUsed = $v; return $this; }

    public function getAnnualLeavesTotal(): int { return $this->annualLeavesTotal; }
    public function setAnnualLeavesTotal(int $v): static { $this->annualLeavesTotal = $v; return $this; }

    public function getSickLeavesUsed(): int { return $this->sickLeavesUsed; }
    public function setSickLeavesUsed(int $v): static { $this->sickLeavesUsed = $v; return $this; }

    public function getSickLeavesTotal(): int { return $this->sickLeavesTotal; }
    public function setSickLeavesTotal(int $v): static { $this->sickLeavesTotal = $v; return $this; }

    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }
    public function getUpdatedAt(): ?\DateTimeImmutable { return $this->updatedAt; }

    public function getRequests(): Collection { return $this->requests; }
    public function getLeaves(): Collection { return $this->leaves; }
    public function getNotifications(): Collection { return $this->notifications; }
}
