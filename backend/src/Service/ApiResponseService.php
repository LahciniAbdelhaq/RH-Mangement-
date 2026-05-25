<?php

namespace App\Service;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Serializer\SerializerInterface;

class ApiResponseService
{
    public function __construct(private readonly SerializerInterface $serializer) {}

    public function success(mixed $data, string $message = 'Succès', int $status = 200, array $groups = []): JsonResponse
    {
        $context = $groups ? ['groups' => $groups] : [];
        $serialized = $this->serializer->serialize(
            ['success' => true, 'message' => $message, 'data' => $data],
            'json',
            array_merge($context, ['json_encode_options' => \JSON_UNESCAPED_UNICODE])
        );
        return new JsonResponse($serialized, $status, [], true);
    }

    public function paginated(array $result, string $message = 'Succès', array $groups = []): JsonResponse
    {
        $context = $groups ? ['groups' => $groups] : [];
        $serialized = $this->serializer->serialize([
            'success' => true,
            'message' => $message,
            'data'    => $result['data'],
            'meta'    => [
                'total'       => $result['total'],
                'page'        => $result['page'],
                'limit'       => $result['limit'],
                'total_pages' => (int) ceil($result['total'] / $result['limit']),
            ],
        ], 'json', array_merge($context, ['json_encode_options' => \JSON_UNESCAPED_UNICODE]));

        return new JsonResponse($serialized, 200, [], true);
    }

    public function error(string $message, int $status = 400, array $errors = []): JsonResponse
    {
        $payload = ['success' => false, 'message' => $message];
        if ($errors) {
            $payload['errors'] = $errors;
        }
        return new JsonResponse($payload, $status);
    }

    public function notFound(string $message = 'Ressource introuvable'): JsonResponse
    {
        return $this->error($message, 404);
    }

    public function forbidden(string $message = 'Accès refusé'): JsonResponse
    {
        return $this->error($message, 403);
    }
}
