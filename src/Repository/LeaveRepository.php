
namespace App\Repository;

use App\Entity\Leave;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class LeaveRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Leave::class);
    }

    public function findByEmployee(int $userId, ?string $status = null, ?string $type = null): array
    {
        $qb = $this->createQueryBuilder('l')
            ->where('l.employee = :uid')
            ->setParameter('uid', $userId)
            ->orderBy('l.startDate', 'DESC');

        if ($status) $qb->andWhere('l.status = :status')->setParameter('status', $status);
        if ($type)   $qb->andWhere('l.type = :type')->setParameter('type', $type);

        return $qb->getQuery()->getResult();
    }

    public function findByDepartment(string $dept, ?string $status = null, ?string $type = null): array
    {
        $qb = $this->createQueryBuilder('l')
            ->where('LOWER(l.department) = LOWER(:dept)')
            ->setParameter('dept', $dept)
            ->orderBy('l.startDate', 'DESC');

        if ($status) $qb->andWhere('l.status = :status')->setParameter('status', $status);
        if ($type)   $qb->andWhere('l.type = :type')->setParameter('type', $type);

        return $qb->getQuery()->getResult();
    }

    public function findAllFiltered(?string $status = null, ?string $type = null): array
    {
        $qb = $this->createQueryBuilder('l')->orderBy('l.startDate', 'DESC');

        if ($status) $qb->andWhere('l.status = :status')->setParameter('status', $status);
        if ($type)   $qb->andWhere('l.type = :type')->setParameter('type', $type);

        return $qb->getQuery()->getResult();
    }

    public function findPendingExcluding(int $excludeUserId): array
    {
        return $this->createQueryBuilder('l')
            ->where('l.status = :status')
            ->andWhere('l.employee != :uid')
            ->setParameter('status', 'En attente')
            ->setParameter('uid', $excludeUserId)
            ->orderBy('l.createdAt', 'DESC')
            ->getQuery()->getResult();
    }

    public function findByMonth(int $year, int $month): array
    {
        $start = new \DateTimeImmutable("{$year}-{$month}-01");
        $end   = $start->modify('last day of this month');

        return $this->createQueryBuilder('l')
            ->where('l.startDate <= :end AND l.endDate >= :start')
            ->setParameter('start', $start->format('Y-m-d'))
            ->setParameter('end', $end->format('Y-m-d'))
            ->orderBy('l.startDate', 'ASC')
            ->getQuery()->getResult();
    }

    public function findUpcoming(\DateTimeImmutable $from, \DateTimeImmutable $until): array
    {
        return $this->createQueryBuilder('l')
            ->where('l.startDate BETWEEN :from AND :until')
            ->andWhere('l.status = :status')
            ->setParameter('from', $from->format('Y-m-d'))
            ->setParameter('until', $until->format('Y-m-d'))
            ->setParameter('status', 'Approuvé')
            ->orderBy('l.startDate', 'ASC')
            ->getQuery()->getResult();
    }
}

