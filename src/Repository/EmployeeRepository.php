
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
