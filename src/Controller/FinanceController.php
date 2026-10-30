<?php

namespace App\Controller;

use App\Repository\EmployeeRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

/**
 * FinanceController — Payroll & Salary Management
 *
 * Implements Moroccan tax calculation logic matching Finance.jsx:
 *   - CNSS  : 4.48% capped on first 6,000 MAD
 *   - AMO   : 2.26% on base salary (no ceiling)
 *   - IGR   : Progressive bracket tax on taxable income
 *
 * Restricted to: HR_MANAGER only
 *
 * Maps to React page: src/pages/Finance.jsx
 */
#[Route('/api/finance', name: 'api_finance_')]
class FinanceController extends AbstractController
{
    public function __construct(
        private EmployeeRepository $employeeRepo,
        private EntityManagerInterface $em
    ) {}

    // ─── LIST EMPLOYEES FOR PAYROLL ───────────────────────────────────────────

    #[Route('/employees', name: 'employees', methods: ['GET'])]
    public function employees(): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_HR_MANAGER');

        $employees = $this->employeeRepo->findAll();

        return $this->json(array_map(fn($e) => [
            'id'           => $e->getId(),
            'name'         => $e->getFullName(),
            'role'         => $e->getRole(),
            'department'   => $e->getDepartment(),
            'baseSalary'   => $e->getBaseSalary(),
            'contractType' => $e->getContractType(),
        ], $employees));
    }

    // ─── COMPUTE PAYSLIP ──────────────────────────────────────────────────────

    /**
     * POST /api/finance/payslip
     * Body: { employeeId, bonus, allowance }
     * Returns full payslip breakdown with Moroccan tax deductions.
     */
    #[Route('/payslip', name: 'payslip', methods: ['POST'])]
    public function payslip(Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_HR_MANAGER');

        $data = json_decode($request->getContent(), true);

        $employeeId = $data['employeeId'] ?? null;
        $bonus      = (float) ($data['bonus']     ?? 0);
        $allowance  = (float) ($data['allowance'] ?? 0);

        if (!$employeeId) {
            return $this->json(['error' => 'employeeId is required'], 400);
        }

        $employee = $this->employeeRepo->find($employeeId);
        if (!$employee) {
            return $this->json(['error' => 'Employee not found'], 404);
        }

        $baseSalary  = (float) $employee->getBaseSalary();
        $grossSalary = $baseSalary + $bonus + $allowance;

        // ── CNSS: 4.48% capped at 6,000 MAD base ──────────────────────────
        $cnssBase      = min($baseSalary, 6000);
        $cnss          = round($cnssBase * 0.0448, 2);

        // ── AMO: 2.26% on base salary (no ceiling) ────────────────────────
        $amo           = round($baseSalary * 0.0226, 2);

        // ── IGR: Progressive Moroccan income tax brackets ─────────────────
        $taxable       = $grossSalary - $cnss - $amo;
        $igr           = $this->calculateIGR($taxable);

        $totalDeductions = round($cnss + $amo + $igr, 2);
        $netSalary       = round($grossSalary - $totalDeductions, 2);

        return $this->json([
            'employee'     => [
                'id'           => $employee->getId(),
                'name'         => $employee->getFullName(),
                'role'         => $employee->getRole(),
                'department'   => $employee->getDepartment(),
                'contractType' => $employee->getContractType(),
            ],
            'salary' => [
                'baseSalary'      => $baseSalary,
                'bonus'           => $bonus,
                'allowance'       => $allowance,
                'grossSalary'     => $grossSalary,
            ],
            'deductions' => [
                'cnss'            => $cnss,
                'amo'             => $amo,
                'igr'             => $igr,
                'total'           => $totalDeductions,
            ],
            'netSalary'    => $netSalary,
            'generatedAt'  => (new \DateTimeImmutable())->format('c'),
            'month'        => date('F Y'),
        ]);
    }

    // ─── PAYROLL SUMMARY (all employees) ─────────────────────────────────────

    #[Route('/summary', name: 'summary', methods: ['GET'])]
    public function summary(): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_HR_MANAGER');

        $employees = $this->employeeRepo->findAll();

        $totalGross = 0;
        $totalNet   = 0;
        $totalTax   = 0;

        foreach ($employees as $e) {
            $base     = (float) $e->getBaseSalary();
            $gross    = $base; // No bonus/allowance in summary
            $cnss     = round(min($base, 6000) * 0.0448, 2);
            $amo      = round($base * 0.0226, 2);
            $igr      = $this->calculateIGR($gross - $cnss - $amo);
            $tax      = $cnss + $amo + $igr;
            $net      = $gross - $tax;

            $totalGross += $gross;
            $totalNet   += $net;
            $totalTax   += $tax;
        }

        return $this->json([
            'employeeCount' => count($employees),
            'totalGross'    => round($totalGross, 2),
            'totalNet'      => round($totalNet, 2),
            'totalTax'      => round($totalTax, 2),
            'currency'      => 'MAD',
        ]);
    }

    // ─── MOROCCAN IGR TAX BRACKETS ────────────────────────────────────────────

    private function calculateIGR(float $taxable): float
    {
        $igr = match (true) {
            $taxable > 15000 => $taxable * 0.38 - 2033,
            $taxable > 10000 => $taxable * 0.34 - 1433,
            $taxable > 8000  => $taxable * 0.30 - 1033,
            $taxable > 6000  => $taxable * 0.20 - 533,
            $taxable > 4000  => $taxable * 0.10 - 250,
            default          => 0,
        };

        return round(max(0, $igr), 2);
    }
}
