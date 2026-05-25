<?php

namespace App\Repository;

use App\Entity\CorrectionDemande;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<CorrectionDemande>
 */
class CorrectionDemandeRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, CorrectionDemande::class);
    }

    public function findPending(): array
    {
        return $this->createQueryBuilder('c')
            ->where('c.statut = :statut')
            ->setParameter('statut', CorrectionDemande::STATUT_EN_ATTENTE)
            ->orderBy('c.dateCreation', 'ASC')
            ->getQuery()
            ->getResult();
    }
}
