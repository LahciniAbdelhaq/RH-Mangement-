<?php

namespace App\EventListener;

use App\Entity\User;
use Lexik\Bundle\JWTAuthenticationBundle\Event\JWTCreatedEvent;
use Symfony\Component\EventDispatcher\Attribute\AsEventListener;

#[AsEventListener(event: 'lexik_jwt_authentication.on_jwt_created')]
class JwtCreatedListener
{
    public function __invoke(JWTCreatedEvent $event): void
    {
        $user = $event->getUser();
        if (!$user instanceof User) {
            return;
        }

        $payload = $event->getData();
        $payload['id'] = $user->getId();
        $payload['roles'] = $user->getRoles();
        $payload['isActive'] = $user->isActive();

        $employe = $user->getEmploye();
        if ($employe) {
            $payload['employe_id'] = $employe->getId();
            $payload['nom'] = $employe->getNom();
            $payload['prenom'] = $employe->getPrenom();
            $payload['matricule'] = $employe->getMatricule();
            $payload['service_id'] = $employe->getService()?->getId();
            $payload['service_nom'] = $employe->getService()?->getNom();
            $payload['photo'] = $employe->getPhoto();
        }

        $event->setData($payload);
    }
}
