<?php

namespace App\Entity;

use App\Repository\ServiceRHRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: ServiceRHRepository::class)]
#[ORM\Table(name: 'services')]
class ServiceRH
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['service:read', 'employe:read', 'affectation:read'])]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    #[Assert\NotBlank]
    #[Groups(['service:read', 'employe:read', 'affectation:read'])]
    private ?string $nom = null;

    #[ORM\Column(type: 'text', nullable: true)]
    #[Groups(['service:read'])]
    private ?string $description = null;

    #[ORM\ManyToOne(targetEntity: Employe::class)]
    #[ORM\JoinColumn(nullable: true)]
    #[Groups(['service:read'])]
    private ?Employe $chefService = null;

    #[ORM\OneToMany(mappedBy: 'service', targetEntity: Employe::class)]
    #[Groups(['service:read'])]
    private Collection $employes;

    public function __construct()
    {
        $this->employes = new ArrayCollection();
    }

    public function getId(): ?int { return $this->id; }

    public function getNom(): ?string { return $this->nom; }
    public function setNom(string $nom): static { $this->nom = $nom; return $this; }

    public function getDescription(): ?string { return $this->description; }
    public function setDescription(?string $description): static { $this->description = $description; return $this; }

    public function getChefService(): ?Employe { return $this->chefService; }
    public function setChefService(?Employe $chefService): static { $this->chefService = $chefService; return $this; }

    public function getEmployes(): Collection { return $this->employes; }
    public function addEmploye(Employe $employe): static
    {
        if (!$this->employes->contains($employe)) {
            $this->employes->add($employe);
            $employe->setService($this);
        }
        return $this;
    }
    public function removeEmploye(Employe $employe): static
    {
        if ($this->employes->removeElement($employe)) {
            if ($employe->getService() === $this) {
                $employe->setService(null);
            }
        }
        return $this;
    }
}
