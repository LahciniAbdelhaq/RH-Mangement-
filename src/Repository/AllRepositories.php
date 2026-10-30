<?php
// ════════════════════════════════════════════════════════════════════════════
//  UserRepository
// ════════════════════════════════════════════════════════════════════════════

namespace App\Repository;

use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Security\Core\Exception\UnsupportedUserException;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\PasswordUpgraderInterface;

class UserRepository extends ServiceEntityRepository implements PasswordUpgraderInterface
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, User::class);
    }

    public function upgradePassword(PasswordAuthenticatedUserInterface $user, string $newHashedPassword): void
    {
        if (!$user instanceof User) {
            throw new UnsupportedUserException(sprintf('Instances of "%s" are not supported.', $user::class));
        }
        $user->setPassword($newHashedPassword);
        $this->getEntityManager()->persist($user);
        $this->getEntityManager()->flush();
    }

    public function findByHrRole(string $role): array
    {
        return $this->createQueryBuilder('u')
            ->where('u.hrRole = :role')
            ->setParameter('role', $role)
            ->orderBy('u.firstName', 'ASC')
            ->getQuery()->getResult();
    }

    public function findByDepartment(string $department): array
    {
        return $this->createQueryBuilder('u')
            ->where('u.department = :dept')
            ->setParameter('dept', $department)
            ->orderBy('u.firstName', 'ASC')
            ->getQuery()->getResult();
    }
}


// ════════════════════════════════════════════════════════════════════════════
//  EmployeeRepository
// ════════════════════════════════════════════════════════════════════════════

namespace App\Repository;

use App\Entity\Employee;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class EmployeeRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Employee::class);
    }

    public function findByDepartment(string $department): array
    {
        return $this->createQueryBuilder('e')
            ->where('LOWER(e.department) = LOWER(:dept)')
            ->setParameter('dept', $department)
            ->orderBy('e.lastName', 'ASC')
            ->getQuery()->getResult();
    }

    public function search(string $query): array
    {
        return $this->createQueryBuilder('e')
            ->where('LOWER(e.firstName) LIKE LOWER(:q) OR LOWER(e.lastName) LIKE LOWER(:q) OR LOWER(e.email) LIKE LOWER(:q)')
            ->setParameter('q', "%{$query}%")
            ->orderBy('e.lastName', 'ASC')
            ->getQuery()->getResult();
    }
}


// ════════════════════════════════════════════════════════════════════════════
//  HrRequestRepository
// ════════════════════════════════════════════════════════════════════════════

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


// ════════════════════════════════════════════════════════════════════════════
//  LeaveRepository
// ════════════════════════════════════════════════════════════════════════════

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


// ════════════════════════════════════════════════════════════════════════════
//  ComplianceRecordRepository
// ════════════════════════════════════════════════════════════════════════════

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


// ════════════════════════════════════════════════════════════════════════════
//  NotificationRepository
// ════════════════════════════════════════════════════════════════════════════

namespace App\Repository;

use App\Entity\Notification;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class NotificationRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Notification::class);
    }

    public function findForUser(int $userId, string $tab = 'all'): array
    {
        $qb = $this->createQueryBuilder('n')
            ->where('n.recipient = :uid')
            ->setParameter('uid', $userId)
            ->orderBy('n.createdAt', 'DESC');

        match ($tab) {
            'unread'  => $qb->andWhere('n.unread = true'),
            'request' => $qb->andWhere('n.type = :type')->setParameter('type', 'request'),
            'alert'   => $qb->andWhere('n.type = :type')->setParameter('type', 'alert'),
            'info'    => $qb->andWhere('n.type = :type')->setParameter('type', 'info'),
            default   => null,
        };

        return $qb->getQuery()->getResult();
    }
}


// ════════════════════════════════════════════════════════════════════════════
//  AuditLogRepository
// ════════════════════════════════════════════════════════════════════════════

namespace App\Repository;

use App\Entity\AuditLog;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\Persistence\ManagerRegistry;

class AuditLogRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry, private EntityManagerInterface $em)
    {
        parent::__construct($registry, AuditLog::class);
    }

    public function findAll(): array
    {
        return $this->createQueryBuilder('a')
            ->orderBy('a.timestamp', 'DESC')
            ->getQuery()->getResult();
    }

    public function deleteAll(): void
    {
        $this->createQueryBuilder('a')->delete()->getQuery()->execute();
    }

    public function log(string $action, ?string $userName, ?string $details = null): void
    {
        $log = AuditLog::create($action, $userName, $details);
        $this->em->persist($log);
        $this->em->flush();
    }
}
