<?php

namespace App\Controller;

use App\Entity\Employee;
use App\Repository\EmployeeRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

/**
 * EmployeeController
 *
 * Roles allowed:
 *   - GET (list/view): HR_MANAGER, HR_AGENT, DEPARTMENT_MANAGER, INTERIM_MANAGER
 *   - POST / PUT / DELETE: HR_MANAGER, HR_AGENT only
 *
 * Maps to React page: src/pages/Employees.jsx
 */
#[Route('/api/employees', name: 'api_employees_')]
class EmployeeController extends AbstractController
{
    public function __construct(
        private EmployeeRepository $repo,
        private EntityManagerInterface $em
    ) {}

    // ─── LIST ─────────────────────────────────────────────────────────────────

    #[Route('', name: 'list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_USER');

        $role = $this->getUser()->getRoles();
        $user = $this->getUser();

        // DEPARTMENT_MANAGER / INTERIM_MANAGER see only their department
        if (in_array('ROLE_DEPARTMENT_MANAGER', $role) || in_array('ROLE_INTERIM_MANAGER', $role)) {
            $employees = $this->repo->findByDepartment($user->getDepartment());
        } else {
            $employees = $this->repo->findAll();
        }

        // Optional search filter
        $search = $request->query->get('search');
        if ($search) {
            $employees = array_filter($employees, fn($e) =>
                str_contains(strtolower($e->getFullName()), strtolower($search)) ||
                str_contains(strtolower($e->getEmail()), strtolower($search))
            );
        }

        return $this->json(array_values($employees), 200, [], ['groups' => ['employee:read']]);
    }

    // ─── GET ONE ──────────────────────────────────────────────────────────────

    #[Route('/{id}', name: 'show', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function show(int $id): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_USER');

        $employee = $this->repo->find($id);
        if (!$employee) {
            return $this->json(['error' => 'Employee not found'], 404);
        }

        return $this->json($employee, 200, [], ['groups' => ['employee:read', 'employee:detail']]);
    }

    // ─── CREATE ───────────────────────────────────────────────────────────────

    #[Route('', name: 'create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_HR_AGENT'); // HR_AGENT and HR_MANAGER

        $data = json_decode($request->getContent(), true);

        if (empty($data['firstName']) || empty($data['lastName']) || empty($data['email'])) {
            return $this->json(['error' => 'firstName, lastName and email are required'], 400);
        }

        // Check email uniqueness
        $existing = $this->repo->findOneBy(['email' => $data['email']]);
        if ($existing) {
            return $this->json(['error' => 'Email already used by another employee'], 409);
        }

        $employee = new Employee();
        $employee->setFirstName($data['firstName']);
        $employee->setLastName($data['lastName']);
        $employee->setEmail($data['email']);
        $employee->setRole($data['role'] ?? null);
        $employee->setDepartment($data['dept'] ?? null);
        $employee->setContractType($data['contract'] ?? 'CDI');
        $employee->setPhone($data['phone'] ?? null);

        $this->em->persist($employee);
        $this->em->flush();

        return $this->json($employee, 201, [], ['groups' => ['employee:read']]);
    }

    // ─── UPDATE ───────────────────────────────────────────────────────────────

    #[Route('/{id}', name: 'update', methods: ['PUT', 'PATCH'], requirements: ['id' => '\d+'])]
    public function update(int $id, Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_HR_AGENT');

        $employee = $this->repo->find($id);
        if (!$employee) {
            return $this->json(['error' => 'Employee not found'], 404);
        }

        $data = json_decode($request->getContent(), true);

        if (isset($data['firstName']))    $employee->setFirstName($data['firstName']);
        if (isset($data['lastName']))     $employee->setLastName($data['lastName']);
        if (isset($data['email']))        $employee->setEmail($data['email']);
        if (isset($data['role']))         $employee->setRole($data['role']);
        if (isset($data['dept']))         $employee->setDepartment($data['dept']);
        if (isset($data['contract']))     $employee->setContractType($data['contract']);
        if (isset($data['phone']))        $employee->setPhone($data['phone']);

        $this->em->flush();

        return $this->json($employee, 200, [], ['groups' => ['employee:read']]);
    }

    // ─── DELETE ───────────────────────────────────────────────────────────────

    #[Route('/{id}', name: 'delete', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    public function delete(int $id): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_HR_AGENT');

        $employee = $this->repo->find($id);
        if (!$employee) {
            return $this->json(['error' => 'Employee not found'], 404);
        }

        $this->em->remove($employee);
        $this->em->flush();

        return $this->json(['message' => "Employee {$employee->getFullName()} deleted successfully"], 200);
    }
}
