<?php

namespace App\Repository;

use App\Entity\Employe;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Employe>
 */
class EmployeRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Employe::class);
    }

    public function findWithFilters(array $filters = [], int $page = 1, int $limit = 20): array
    {
        $qb = $this->createQueryBuilder('e')
            ->leftJoin('e.service', 's')
            ->addSelect('s')
            ->leftJoin('e.user', 'u')
            ->addSelect('u');

        if (!empty($filters['search'])) {
            $qb->andWhere('e.nom LIKE :search OR e.prenom LIKE :search OR e.matricule LIKE :search OR e.cin LIKE :search')
               ->setParameter('search', '%' . $filters['search'] . '%');
        }

        if (!empty($filters['service'])) {
            $qb->andWhere('s.id = :service')
               ->setParameter('service', $filters['service']);
        }

        if (!empty($filters['statut'])) {
            $qb->andWhere('e.statut = :statut')
               ->setParameter('statut', $filters['statut']);
        }

        $total = (clone $qb)->select('COUNT(e.id)')->getQuery()->getSingleScalarResult();

        $results = $qb->setFirstResult(($page - 1) * $limit)
            ->setMaxResults($limit)
            ->orderBy('e.nom', 'ASC')
            ->getQuery()
            ->getResult();

        return ['data' => $results, 'total' => (int) $total, 'page' => $page, 'limit' => $limit];
    }

    public function findByService(int $serviceId): array
    {
        return $this->createQueryBuilder('e')
            ->where('e.service = :service')
            ->setParameter('service', $serviceId)
            ->orderBy('e.nom', 'ASC')
            ->getQuery()
            ->getResult();
    }
}
