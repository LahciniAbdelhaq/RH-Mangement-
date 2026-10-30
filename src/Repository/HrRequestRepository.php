
namespace App\Repository;

use App\Entity\HrRequest;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class HrRequestRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, HrRequest::class);
    }

    public function findByOwner(int $userId, ?string $status = null): array
    {
        $qb = $this->createQueryBuilder('r')
            ->where('r.ownerUser = :uid')
            ->setParameter('uid', $userId)
            ->orderBy('r.createdAt', 'DESC');

        if ($status) {
            $qb->andWhere('r.status = :status')->setParameter('status', $status);
        }

        return $qb->getQuery()->getResult();
    }

    public function findByDepartment(string $dept, ?string $status = null): array
    {
        $qb = $this->createQueryBuilder('r')
            ->where('LOWER(r.department) = LOWER(:dept)')
            ->setParameter('dept', $dept)
            ->orderBy('r.createdAt', 'DESC');

        if ($status) {
            $qb->andWhere('r.status = :status')->setParameter('status', $status);
        }

        return $qb->getQuery()->getResult();
    }

    public function findAllFiltered(?string $status = null): array
    {
        $qb = $this->createQueryBuilder('r')->orderBy('r.createdAt', 'DESC');

        if ($status) {
            $qb->where('r.status = :status')->setParameter('status', $status);
        }

        return $qb->getQuery()->getResult();
    }

    public function countByStatus(string $status): int
    {
        return (int) $this->createQueryBuilder('r')
            ->select('COUNT(r.id)')
            ->where('r.status = :status')
            ->setParameter('status', $status)
            ->getQuery()->getSingleScalarResult();
    }

    public function findByShareToken(string $token): ?HrRequest
    {
        return $this->findOneBy(['shareToken' => $token]);
    }
}

