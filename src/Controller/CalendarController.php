<?php

namespace App\Controller;

use App\Repository\LeaveRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

/**
 * CalendarController — HR Calendar & Scheduling
 *
 * Returns leave events + Moroccan public holidays for calendar view.
 * Restricted to: HR_MANAGER, HR_AGENT
 *
 * Maps to React page: src/pages/Calendar.jsx
 */
#[Route('/api/calendar', name: 'api_calendar_')]
class CalendarController extends AbstractController
{
    // Moroccan public holidays — matches the static list in Calendar.jsx
    private const MOROCCAN_HOLIDAYS = [
        ['month' => 1,  'day' => 1,  'nameFr' => "Nouvel An",                         'nameEn' => "New Year's Day"],
        ['month' => 1,  'day' => 11, 'nameFr' => "Manifeste de l'Indépendance",        'nameEn' => "Independence Manifesto"],
        ['month' => 5,  'day' => 1,  'nameFr' => "Fête du Travail",                    'nameEn' => "Labour Day"],
        ['month' => 7,  'day' => 30, 'nameFr' => "Fête du Trône",                      'nameEn' => "Throne Day"],
        ['month' => 8,  'day' => 14, 'nameFr' => "Allégeance Oued Eddahab",            'nameEn' => "Oued Eddahab Day"],
        ['month' => 8,  'day' => 20, 'nameFr' => "Révolution du Roi et du Peuple",     'nameEn' => "Revolution of the King & People"],
        ['month' => 8,  'day' => 21, 'nameFr' => "Fête de la Jeunesse",                'nameEn' => "Youth Day"],
        ['month' => 11, 'day' => 6,  'nameFr' => "Marche Verte",                       'nameEn' => "Green March Day"],
        ['month' => 11, 'day' => 18, 'nameFr' => "Fête de l'Indépendance",             'nameEn' => "Independence Day"],
    ];

    public function __construct(
        private LeaveRepository $leaveRepo
    ) {}

    // ─── EVENTS FOR A GIVEN MONTH ─────────────────────────────────────────────

    /**
     * GET /api/calendar/events?year=2026&month=5
     * Returns both leave events and public holidays for the requested month.
     */
    #[Route('/events', name: 'events', methods: ['GET'])]
    public function events(Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_HR_AGENT');

        $year  = (int) $request->query->get('year',  date('Y'));
        $month = (int) $request->query->get('month', date('n'));

        if ($month < 1 || $month > 12) {
            return $this->json(['error' => 'Invalid month'], 400);
        }

        // Leave events from DB for this month
        $leaves = $this->leaveRepo->findByMonth($year, $month);

        $leaveEvents = array_map(function ($leave) {
            return [
                'id'         => $leave->getId(),
                'employee'   => $leave->getName(),
                'department' => $leave->getDepartment(),
                'type'       => $leave->getType(),
                'start'      => $leave->getStartDate()->format('Y-m-d'),
                'end'        => $leave->getEndDate()->format('Y-m-d'),
                'status'     => $leave->getStatus(),
                'eventType'  => $this->mapLeaveTypeToEvent($leave->getType()),
            ];
        }, $leaves);

        // Filter holidays for the requested month
        $holidays = array_values(array_filter(
            self::MOROCCAN_HOLIDAYS,
            fn($h) => $h['month'] === $month
        ));

        return $this->json([
            'year'         => $year,
            'month'        => $month,
            'leaveEvents'  => $leaveEvents,
            'holidays'     => $holidays,
        ]);
    }

    // ─── HOLIDAYS ONLY ────────────────────────────────────────────────────────

    #[Route('/holidays', name: 'holidays', methods: ['GET'])]
    public function holidays(): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_USER');

        return $this->json(['holidays' => self::MOROCCAN_HOLIDAYS]);
    }

    // ─── UPCOMING EVENTS (next 30 days) ──────────────────────────────────────

    #[Route('/upcoming', name: 'upcoming', methods: ['GET'])]
    public function upcoming(): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_HR_AGENT');

        $now    = new \DateTimeImmutable();
        $until  = $now->modify('+30 days');

        $leaves = $this->leaveRepo->findUpcoming($now, $until);

        return $this->json(array_map(function ($leave) {
            return [
                'id'       => $leave->getId(),
                'employee' => $leave->getName(),
                'type'     => $leave->getType(),
                'start'    => $leave->getStartDate()->format('Y-m-d'),
                'end'      => $leave->getEndDate()->format('Y-m-d'),
                'status'   => $leave->getStatus(),
            ];
        }, $leaves));
    }

    // ─── HELPER ──────────────────────────────────────────────────────────────

    private function mapLeaveTypeToEvent(string $type): string
    {
        return match (true) {
            str_contains($type, 'Annuel')     => 'paid',
            str_contains($type, 'Maladie')    => 'sick',
            str_contains($type, 'Télétravail') => 'remote',
            default                           => 'other',
        };
    }
}
