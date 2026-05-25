<?php

namespace App\Service;

use App\Entity\Employe;
use App\Entity\Notification;
use Doctrine\ORM\EntityManagerInterface;

class NotificationService
{
    public function __construct(private readonly EntityManagerInterface $em) {}

    public function notify(Employe $employe, string $titre, string $message, string $type = 'info'): void
    {
        $notification = new Notification();
        $notification->setEmploye($employe);
        $notification->setTitre($titre);
        $notification->setMessage($message);
        $notification->setType($type);

        $this->em->persist($notification);
        $this->em->flush();
    }

    public function notifyCongeStatut(Employe $employe, string $statut, ?string $commentaire = null): void
    {
        $messages = [
            'APPROUVE_CHEF' => ['Congé validé par le chef', 'Votre demande de congé a été validée par votre chef de service et est en attente de traitement RH.', 'success'],
            'APPROUVE'      => ['Congé approuvé', 'Votre demande de congé a été approuvée par le service RH.', 'success'],
            'REFUSE'        => ['Congé refusé', 'Votre demande de congé a été refusée.' . ($commentaire ? ' Motif : ' . $commentaire : ''), 'error'],
        ];

        if (isset($messages[$statut])) {
            [$titre, $msg, $type] = $messages[$statut];
            $this->notify($employe, $titre, $msg, $type);
        }
    }

    public function notifyCorrectionStatut(Employe $employe, string $statut, ?string $motifRefus = null): void
    {
        if ($statut === 'APPROUVEE') {
            $this->notify($employe, 'Correction approuvée', 'Votre demande de correction a été approuvée et votre dossier a été mis à jour.', 'success');
        } elseif ($statut === 'REFUSEE') {
            $this->notify($employe, 'Correction refusée', 'Votre demande de correction a été refusée.' . ($motifRefus ? ' Motif : ' . $motifRefus : ''), 'error');
        }
    }
}
