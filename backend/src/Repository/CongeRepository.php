<?php

namespace App\Repository;

use App\Entity\Conge;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Conge>
 */
class CongeRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Conge::class);
    }

    public function findByEmploye(int $employeId): array
    {
        return $this->createQueryBuilder('c')
            ->where('c.employe = :employe')
            ->setParameter('employe', $employeId)
            ->orderBy('c.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function findPendingForService(int $serviceId): array
    {
        return $this->createQueryBuilder('c')
            ->join('c.employe', 'e')
            ->where('e.service = :service')
            ->andWhere('c.statut = :statut')
            ->setParameter('service', $serviceId)
            ->setParameter('statut', Conge::STATUT_EN_ATTENTE)
            ->orderBy('c.createdAt', 'ASC')
            ->getQuery()
            ->getResult();
    }
}
