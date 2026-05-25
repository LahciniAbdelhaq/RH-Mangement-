<?php

namespace App\DataFixtures;

use App\Entity\Employe;
use App\Entity\Formation;
use App\Entity\ServiceRH;
use App\Entity\User;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class AppFixtures extends Fixture
{
    public function __construct(private readonly UserPasswordHasherInterface $passwordHasher) {}

    public function load(ObjectManager $manager): void
    {
        // Services
        $services = [];
        $serviceData = [
            ['Ressources Humaines', 'Direction des Ressources Humaines'],
            ['Informatique', 'Service Informatique et Numérique'],
            ['Finance', 'Service Finance et Comptabilité'],
            ['Scolarité', 'Service de la Scolarité'],
            ['Recherche', 'Service Recherche et Développement'],
        ];

        foreach ($serviceData as [$nom, $desc]) {
            $service = new ServiceRH();
            $service->setNom($nom);
            $service->setDescription($desc);
            $manager->persist($service);
            $services[] = $service;
        }

        $manager->flush();

        // Utilisateurs et Employés
        $usersData = [
            ['admin@rh.ma',    ['ROLE_ADMIN_RH'],            'Alaoui',   'Mohammed',   'M001', 'Directeur RH',   'Directeur',        $services[0]],
            ['agent@rh.ma',    ['ROLE_AGENT_RH'],            'Benali',   'Fatima',     'M002', 'Agent RH',       'Agent',            $services[0]],
            ['chef@service.ma',['ROLE_CHEF_SERVICE'],         'Mansour',  'Karim',      'M003', 'Chef de Service','Chef de Service',  $services[1]],
            ['employe@rh.ma',  ['ROLE_EMPLOYE'],              'Tazi',     'Youssef',    'M004', 'Développeur',    'Développeur',      $services[1]],
            ['secretaire@rh.ma',['ROLE_SECRETAIRE_GENERALE'], 'Chraibi',  'Nadia',      'M005', 'Secrétaire Gén.','Secrétaire Gén.', $services[0]],
        ];

        foreach ($usersData as [$email, $roles, $nom, $prenom, $matricule, $poste, $grade, $service]) {
            $user = new User();
            $user->setEmail($email);
            $user->setRoles($roles);
            $user->setIsActive(true);
            $user->setPassword($this->passwordHasher->hashPassword($user, 'Password123!'));
            $manager->persist($user);

            $employe = new Employe();
            $employe->setNom($nom);
            $employe->setPrenom($prenom);
            $employe->setMatricule($matricule);
            $employe->setPoste($poste);
            $employe->setGrade($grade);
            $employe->setService($service);
            $employe->setStatut('Actif');
            $employe->setTelephone('0600000000');
            $employe->setAdresse('Kénitra, Maroc');
            $employe->setDateRecrutement(new \DateTime('2020-01-01'));
            $employe->setUser($user);
            $manager->persist($employe);
        }

        // Formations de démonstration
        $formationsData = [
            ['Formation Symfony 7', 'Maîtriser Symfony 7 et les API REST', '2026-06-01', '2026-06-03', 'Centre de Formation Kénitra', 20],
            ['React & TypeScript', 'Développement Frontend moderne', '2026-06-15', '2026-06-17', 'Salle 101 - Informatique', 15],
            ['Gestion de Projet Agile', 'Méthodes agiles et Scrum', '2026-07-01', '2026-07-02', 'Salle de Conférence A', 25],
        ];

        foreach ($formationsData as [$titre, $desc, $debut, $fin, $lieu, $capacite]) {
            $formation = new Formation();
            $formation->setTitre($titre);
            $formation->setDescription($desc);
            $formation->setDateDebut(new \DateTime($debut));
            $formation->setDateFin(new \DateTime($fin));
            $formation->setLieu($lieu);
            $formation->setCapacite($capacite);
            $formation->setStatut(Formation::STATUT_PLANIFIEE);
            $manager->persist($formation);
        }

        $manager->flush();
    }
}
