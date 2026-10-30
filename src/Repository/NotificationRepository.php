
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

