
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
