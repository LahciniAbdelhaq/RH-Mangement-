
namespace App\Repository;

use App\Entity\ComplianceRecord;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class ComplianceRecordRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ComplianceRecord::class);
    }

    public function findAllFiltered(?string $status = null): array
    {
        $qb = $this->createQueryBuilder('c')
            ->leftJoin('c.employee', 'e')
            ->addSelect('e')
            ->orderBy('c.deadline', 'ASC');

        if ($status) {
            $qb->where('c.status = :status')->setParameter('status', $status);
        }

        return $qb->getQuery()->getResult();
    }

    public function findLateRecords(): array
    {
        return $this->createQueryBuilder('c')
            ->leftJoin('c.employee', 'e')
            ->addSelect('e')
            ->where('c.deadline < :today')
            ->andWhere('c.status != :conforme')
            ->setParameter('today', new \DateTimeImmutable('today'))
            ->setParameter('conforme', 'Conforme')
            ->orderBy('c.deadline', 'ASC')
            ->getQuery()->getResult();
    }

    public function countByStatus(string $status): int
    {
        return (int) $this->createQueryBuilder('c')
            ->select('COUNT(c.id)')
            ->where('c.status = :status')
            ->setParameter('status', $status)
            ->getQuery()->getSingleScalarResult();
    }
}
