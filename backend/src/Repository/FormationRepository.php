<?php

namespace App\Repository;

use App\Entity\Formation;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Formation>
 */
class FormationRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Formation::class);
    }

    public function findUpcoming(): array
    {
        return $this->createQueryBuilder('f')
            ->where('f.dateDebut >= :today')
            ->andWhere('f.statut = :statut')
            ->setParameter('today', new \DateTime())
            ->setParameter('statut', Formation::STATUT_PLANIFIEE)
            ->orderBy('f.dateDebut', 'ASC')
            ->getQuery()
            ->getResult();
    }
}
