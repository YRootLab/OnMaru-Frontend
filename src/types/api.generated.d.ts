




export interface paths {
    "/api/v1/visit-reviews/{reviewId}/likes/me": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;




        put: operations["like"];
        post?: never;




        delete: operations["unlike"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/saved-resources/places/{placeId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;




        put: operations["savePlace"];
        post?: never;




        delete: operations["deletePlace"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/saved-resources/odii-stories/{storyId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;




        put: operations["saveOdii"];
        post?: never;




        delete: operations["deleteOdii"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/internal/v1/corpus/revisions/{revisionId}/ack": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;




        post: operations["acknowledge"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/visit-reviews/{reviewId}/reports": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;




        post: operations["report"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/saved-journeys": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };




        get: operations["list"];
        put?: never;




        post: operations["create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/saved-journeys/{savedJourneyId}/resume": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;




        post: operations["resume"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/places/{placeId}/visit-reviews": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };




        get: operations["listPlaceVisitReviews"];
        put?: never;




        post: operations["createReview"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/operations/moderation/visit-reviews/{reviewId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;




        post: operations["moderate"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/explorations": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;




        post: operations["create_1"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/explorations/{explorationId}/turns": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;




        post: operations["createTurn"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/explorations/{explorationId}/runs/{runId}/cancel": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;




        post: operations["cancelRun"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/explorations/{explorationId}/actions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;




        post: operations["applyAction"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/logout": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;




        post: operations["logout"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/internal/v1/corpus/revisions/{revisionId}/manifest": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };




        get: operations["manifest"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/internal/v1/corpus/revisions/{revisionId}/documents/{documentId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };




        get: operations["document"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/kakao/login": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };




        get: operations["startLogin"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/kakao/callback": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };




        get: operations["completeLogin"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/csrf": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };




        get: operations["csrfToken"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/visit-reviews": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };




        get: operations["listVisitReviews"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/visit-review-regions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };




        get: operations["listVisitReviewRegions"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/saved-resources": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };




        get: operations["list_1"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/saved-journeys/{savedJourneyId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };




        get: operations["get"];
        put?: never;
        post?: never;




        delete: operations["delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/regions/resolve": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };




        get: operations["resolveRegion"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/places/{placeId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };




        get: operations["canonicalPlace"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/operations/moderation/queue": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };




        get: operations["queue"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/odii/stories": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };




        get: operations["listStories"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/odii/stories/{storyId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };




        get: operations["storyDetail"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/members/me": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };




        get: operations["currentMember"];
        put?: never;
        post?: never;




        delete: operations["deleteCurrentMember"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/me/timeline": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };




        get: operations["getTimeline"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/me/journey-threads": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };




        get: operations["list_2"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/me/journey-threads/{threadId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };




        get: operations["get_1"];
        put?: never;
        post?: never;




        delete: operations["delete_1"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/map/places": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };




        get: operations["listMapPlaces"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/insights/observations": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };




        get: operations["listObservations"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/insights/heatmap": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };




        get: operations["heatmap"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/hanoks": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };




        get: operations["listHanoks"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/hanoks/{placeId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };




        get: operations["hanok"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/hanoks/monthly": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };




        get: operations["monthly"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/explorations/{explorationId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };




        get: operations["get_2"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/explorations/{explorationId}/runs/{runId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };




        get: operations["getRun"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/explorations/{explorationId}/runs/{runId}/events": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };




        get: operations["events"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/visit-reviews/{reviewId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;




        delete: operations["deleteReview"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        ApiErrorResponse: {
            schemaVersion?: string;
            code?: string;
            message?: string;
            requestId?: string;
            details?: {
                [key: string]: Record<string, never>;
            };
        };
        CorpusAcknowledgement: {
            contractVersion?: string;
            revisionId?: string;
            manifestHash?: string;

            status?: "ACTIVE" | "REJECTED";

            documentCount?: number;

            tombstoneCount?: number;
            embeddingProfile?: string;

            completedAt?: string;
            errorCode?: string;
        };

        ReportRequest: {




            reason?: string;




            detail?: string;
        };
        CreateRequest: {

            explorationId?: string;

            baseVersion?: number;
            title?: string;
            unknownFields?: {
                [key: string]: Record<string, never>;
            };
        };

        CreateReviewRequest: {




            text?: string;
        };

        ModerationRequest: {




            nextStatus?: string;




            reason?: string;
        };
        RunAcceptedResponse: {
            schemaVersion?: string;

            explorationId?: string;

            runId?: string;

            stateVersion?: number;
            runUrl?: string;
            eventsUrl?: string;
            snapshotUrl?: string;
        };
        ClarificationAnswer: {
            clarificationId?: string;
            choiceId?: string;
            text?: string;
        };
        CreateTurnRequest: {

            clientTurnId?: string;

            baseVersion?: number;
            query?: string;
            clarificationAnswer?: components["schemas"]["ClarificationAnswer"];
        };
        ClarificationResponse: {
            id?: string;
            reason?: string;
            question?: string;
            choices?: Record<string, never>[];
            allowFreeText?: boolean;
        };
        RunResponse: {
            schemaVersion?: string;

            runId?: string;
            status?: string;
            engine?: string;
            degradedReason?: string;
            stage?: string;
            outcome?: string;
            clarification?: components["schemas"]["ClarificationResponse"];

            retryAfterMs?: number;

            createdAt?: string;

            startedAt?: string;

            deadlineAt?: string;
            error?: Record<string, never>;
        };
        ActionBody: {
            type?: string;
            resourceRef?: components["schemas"]["ResourceBody"];

            proposalId?: string;
        };
        ActionRequest: {

            commandId?: string;

            baseVersion?: number;
            action?: components["schemas"]["ActionBody"];
        };
        ResourceBody: {
            type?: string;
            id?: string;
        };
        ExplorationResponse: {
            schemaVersion?: string;

            explorationId?: string;

            stateVersion?: number;
            board?: Record<string, never>;
            pinnedRefs?: Record<string, never>[];
            excludedRefs?: Record<string, never>[];
            unavailableRefs?: Record<string, never>[];
            execution?: {
                [key: string]: Record<string, never>;
            };
            latestRun?: components["schemas"]["RunResponse"];
            pendingProposal?: Record<string, never>;
            recentHistory?: Record<string, never>[];

            updatedAt?: string;
        };
        CorpusManifest: {
            contractVersion?: string;
            revisionId?: string;

            publishedAt?: string;
            manifestHash?: string;
            documents?: components["schemas"]["CorpusManifestEntry"][];
        };
        CorpusManifestEntry: {
            documentId?: string;
            kind?: string;
            documentHash?: string;
            state?: string;
            contentUrl?: string;
        };
        CorpusDocument: {
            contractVersion?: string;
            revisionId?: string;
            documentId?: string;
            kind?: string;
            sourceId?: string;
            sourceRevision?: string;
            provenanceId?: string;
            category?: string;
            region?: string;
            publicationEligible?: boolean;
            text?: string;
            documentHash?: string;
        };

        CsrfTokenResponse: {




            token?: string;




            headerName?: string;
        };
        SseEmitter: {

            timeout?: number;
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    like: {
        parameters: {
            query?: never;
            header?: never;
            path: {




                reviewId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {

            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": Record<string, never>;
                };
            };

            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiErrorResponse"];
                };
            };

            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiErrorResponse"];
                };
            };

            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiErrorResponse"];
                };
            };
        };
    };
    unlike: {
        parameters: {
            query?: never;
            header?: never;
            path: {




                reviewId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {

            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": Record<string, never>;
                };
            };

            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiErrorResponse"];
                };
            };

            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiErrorResponse"];
                };
            };
        };
    };
    savePlace: {
        parameters: {
            query?: never;
            header?: never;
            path: {




                placeId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {

            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": Record<string, never>;
                };
            };

            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiErrorResponse"];
                };
            };

            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiErrorResponse"];
                };
            };

            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiErrorResponse"];
                };
            };
        };
    };
    deletePlace: {
        parameters: {
            query?: never;
            header?: never;
            path: {




                placeId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {

            204: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": Record<string, never>;
                };
            };

            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiErrorResponse"];
                };
            };
        };
    };
    saveOdii: {
        parameters: {
            query?: never;
            header?: never;
            path: {




                storyId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {

            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": Record<string, never>;
                };
            };

            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiErrorResponse"];
                };
            };

            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiErrorResponse"];
                };
            };

            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiErrorResponse"];
                };
            };
        };
    };
    deleteOdii: {
        parameters: {
            query?: never;
            header?: never;
            path: {




                storyId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {

            204: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": Record<string, never>;
                };
            };

            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiErrorResponse"];
                };
            };
        };
    };
    acknowledge: {
        parameters: {
            query?: never;
            header?: never;
            path: {




                revisionId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CorpusAcknowledgement"];
            };
        };
        responses: {

            202: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };

            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    report: {
        parameters: {
            query?: never;
            header?: {




                "Idempotency-Key"?: string;
            };
            path: {




                reviewId: string;
            };
            cookie?: never;
        };

        requestBody: {
            content: {
                "application/json": components["schemas"]["ReportRequest"];
            };
        };
        responses: {

            202: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": Record<string, never>;
                };
            };

            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiErrorResponse"];
                };
            };

            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiErrorResponse"];
                };
            };

            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiErrorResponse"];
                };
            };

            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiErrorResponse"];
                };
            };
        };
    };
    list: {
        parameters: {
            query?: {




                limit?: number;

                cursor?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {

            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": Record<string, never>;
                };
            };

            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiErrorResponse"];
                };
            };
        };
    };
    create: {
        parameters: {
            query?: never;
            header?: {




                "Idempotency-Key"?: string;
            };
            path?: never;
            cookie?: never;
        };

        requestBody?: {
            content: {
                "application/json": components["schemas"]["CreateRequest"];
            };
        };
        responses: {

            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": Record<string, never>;
                };
            };

            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiErrorResponse"];
                };
            };

            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiErrorResponse"];
                };
            };

            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiErrorResponse"];
                };
            };
        };
    };
    resume: {
        parameters: {
            query?: never;
            header?: {




                "Idempotency-Key"?: string;
            };
            path: {




                savedJourneyId: string;
            };
            cookie?: never;
        };

        requestBody?: {
            content: {
                "application/json": {
                    [key: string]: Record<string, never>;
                };
            };
        };
        responses: {

            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": Record<string, never>;
                };
            };

            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiErrorResponse"];
                };
            };

            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiErrorResponse"];
                };
            };
        };
    };
    listPlaceVisitReviews: {
        parameters: {
            query?: {




                limit?: number;

                cursor?: string;
            };
            header?: never;
            path: {




                placeId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {

            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": Record<string, never>;
                };
            };

            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiErrorResponse"];
                };
            };

            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiErrorResponse"];
                };
            };
        };
    };
    createReview: {
        parameters: {
            query?: never;
            header?: {




                "Idempotency-Key"?: string;
            };
            path: {




                placeId: string;
            };
            cookie?: never;
        };

        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateReviewRequest"];
            };
        };
        responses: {

            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": Record<string, never>;
                };
            };

            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiErrorResponse"];
                };
            };

            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiErrorResponse"];
                };
            };

            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiErrorResponse"];
                };
            };
        };
    };
    moderate: {
        parameters: {
            query?: never;
            header?: {

                Authorization?: string;




                "X-OnMaru-Operator"?: string;
            };
            path: {




                reviewId: string;
            };
            cookie?: never;
        };

        requestBody: {
            content: {
                "application/json": components["schemas"]["ModerationRequest"];
            };
        };
        responses: {

            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": Record<string, never>;
                };
            };

            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiErrorResponse"];
                };
            };

            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiErrorResponse"];
                };
            };

            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiErrorResponse"];
                };
            };
        };
    };
    create_1: {
        parameters: {
            query?: never;
            header?: {




                "Idempotency-Key"?: string;
            };
            path?: never;
            cookie?: never;
        };

        requestBody?: {
            content: {
                "application/json": components["schemas"]["CreateRequest"];
            };
        };
        responses: {

            202: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["RunAcceptedResponse"];
                };
            };

            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiErrorResponse"];
                };
            };

            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiErrorResponse"];
                };
            };
        };
    };
    createTurn: {
        parameters: {
            query?: never;
            header?: {




                "Idempotency-Key"?: string;
            };
            path: {




                explorationId: string;
            };
            cookie?: never;
        };

        requestBody?: {
            content: {
                "application/json": components["schemas"]["CreateTurnRequest"];
            };
        };
        responses: {

            202: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["RunAcceptedResponse"];
                };
            };

            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiErrorResponse"];
                };
            };

            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiErrorResponse"];
                };
            };
        };
    };
    cancelRun: {
        parameters: {
            query?: never;
            header?: {




                "Idempotency-Key"?: string;
            };
            path: {




                explorationId: string;




                runId: string;
            };
            cookie?: never;
        };

        requestBody?: {
            content: {
                "application/json": {
                    [key: string]: Record<string, never>;
                };
            };
        };
        responses: {

            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["RunResponse"];
                };
            };

            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiErrorResponse"];
                };
            };
        };
    };
    applyAction: {
        parameters: {
            query?: never;
            header?: {




                "Idempotency-Key"?: string;
            };
            path: {




                explorationId: string;
            };
            cookie?: never;
        };

        requestBody?: {
            content: {
                "application/json": components["schemas"]["ActionRequest"];
            };
        };
        responses: {

            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ExplorationResponse"];
                };
            };

            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiErrorResponse"];
                };
            };

            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiErrorResponse"];
                };
            };
        };
    };
    logout: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": {
                    [key: string]: Record<string, never>;
                };
            };
        };
        responses: {

            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    manifest: {
        parameters: {
            query?: never;
            header?: never;
            path: {




                revisionId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {

            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["CorpusManifest"];
                };
            };

            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    document: {
        parameters: {
            query?: never;
            header?: never;
            path: {




                revisionId: string;




                documentId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {

            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["CorpusDocument"];
                };
            };

            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    startLogin: {
        parameters: {
            query?: {




                returnTo?: string;




                explorationId?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {

            302: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    completeLogin: {
        parameters: {
            query?: {

                code?: string;

                state?: string;

                error?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {

            303: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    csrfToken: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {

            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["CsrfTokenResponse"];
                };
            };
        };
    };
    listVisitReviews: {
        parameters: {
            query: {




                scope: string;




                regionCode?: string;




                limit?: number;

                cursor?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {

            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": Record<string, never>;
                };
            };

            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiErrorResponse"];
                };
            };

            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiErrorResponse"];
                };
            };
        };
    };
    listVisitReviewRegions: {
        parameters: {
            query?: {




                parentRegionCode?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {

            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": Record<string, never>;
                };
            };

            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiErrorResponse"];
                };
            };

            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiErrorResponse"];
                };
            };
        };
    };
    list_1: {
        parameters: {
            query: {




                type: string;




                limit?: number;

                cursor?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {

            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": Record<string, never>;
                };
            };

            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiErrorResponse"];
                };
            };

            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiErrorResponse"];
                };
            };
        };
    };
    get: {
        parameters: {
            query?: never;
            header?: never;
            path: {




                savedJourneyId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {

            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": Record<string, never>;
                };
            };

            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiErrorResponse"];
                };
            };

            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiErrorResponse"];
                };
            };
        };
    };
    delete: {
        parameters: {
            query?: never;
            header?: {




                "Idempotency-Key"?: string;
            };
            path: {




                savedJourneyId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {

            204: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": Record<string, never>;
                };
            };

            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiErrorResponse"];
                };
            };

            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiErrorResponse"];
                };
            };
        };
    };
    resolveRegion: {
        parameters: {
            query: {




                lat: number;




                lng: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {

            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": Record<string, never>;
                };
            };

            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiErrorResponse"];
                };
            };

            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiErrorResponse"];
                };
            };
        };
    };
    canonicalPlace: {
        parameters: {
            query?: never;
            header?: never;
            path: {




                placeId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {

            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": Record<string, never>;
                };
            };

            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiErrorResponse"];
                };
            };

            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiErrorResponse"];
                };
            };
        };
    };
    queue: {
        parameters: {
            query?: {




                limit?: number;
            };
            header?: {

                Authorization?: string;




                "X-OnMaru-Operator"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {

            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": Record<string, never>;
                };
            };

            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiErrorResponse"];
                };
            };

            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiErrorResponse"];
                };
            };
        };
    };
    listStories: {
        parameters: {
            query?: {




                language?: string;




                category?: string;




                regionCode?: string;




                limit?: string;

                cursor?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {

            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": Record<string, never>;
                };
            };

            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiErrorResponse"];
                };
            };

            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiErrorResponse"];
                };
            };
        };
    };
    storyDetail: {
        parameters: {
            query?: {




                language?: string;
            };
            header?: never;
            path: {




                storyId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {

            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": Record<string, never>;
                };
            };

            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiErrorResponse"];
                };
            };

            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiErrorResponse"];
                };
            };
        };
    };
    currentMember: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {

            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": Record<string, never>;
                };
            };

            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": Record<string, never>;
                };
            };
        };
    };
    deleteCurrentMember: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {

            202: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": Record<string, never>;
                };
            };

            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": Record<string, never>;
                };
            };
        };
    };
    getTimeline: {
        parameters: {
            query?: {




                month?: string;




                limit?: number;

                cursor?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {

            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": Record<string, never>;
                };
            };

            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiErrorResponse"];
                };
            };

            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiErrorResponse"];
                };
            };
        };
    };
    list_2: {
        parameters: {
            query?: {




                limit?: number;

                cursor?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {

            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": Record<string, never>;
                };
            };

            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiErrorResponse"];
                };
            };
        };
    };
    get_1: {
        parameters: {
            query?: never;
            header?: never;
            path: {




                threadId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {

            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": Record<string, never>;
                };
            };

            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiErrorResponse"];
                };
            };

            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiErrorResponse"];
                };
            };
        };
    };
    delete_1: {
        parameters: {
            query?: never;
            header?: {




                "Idempotency-Key"?: string;
            };
            path: {




                threadId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {

            204: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": Record<string, never>;
                };
            };

            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiErrorResponse"];
                };
            };

            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiErrorResponse"];
                };
            };
        };
    };
    listMapPlaces: {
        parameters: {
            query?: {




                language?: string;




                regionCode?: string;




                bbox?: string;




                lat?: number;




                lng?: number;




                radius?: number;




                category?: string;




                limit?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {

            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": Record<string, never>;
                };
            };

            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiErrorResponse"];
                };
            };

            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiErrorResponse"];
                };
            };
        };
    };
    listObservations: {
        parameters: {
            query: {




                regionCode: string;




                metric?: string;




                from?: string;




                to?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {

            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": Record<string, never>;
                };
            };

            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiErrorResponse"];
                };
            };
        };
    };
    heatmap: {
        parameters: {
            query: {




                regionCode?: string;




                date: string;




                metric?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {

            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": Record<string, never>;
                };
            };

            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiErrorResponse"];
                };
            };
        };
    };
    listHanoks: {
        parameters: {
            query?: {




                keyword?: string;




                regionCode?: string;




                category?: string;




                hasImage?: boolean;




                limit?: number;

                cursor?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {

            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": Record<string, never>;
                };
            };

            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiErrorResponse"];
                };
            };

            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiErrorResponse"];
                };
            };
        };
    };
    hanok: {
        parameters: {
            query?: never;
            header?: never;
            path: {




                placeId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {

            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": Record<string, never>;
                };
            };

            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiErrorResponse"];
                };
            };

            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiErrorResponse"];
                };
            };
        };
    };
    monthly: {
        parameters: {
            query: {




                month: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {

            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": Record<string, never>;
                };
            };

            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiErrorResponse"];
                };
            };
        };
    };
    get_2: {
        parameters: {
            query?: never;
            header?: never;
            path: {




                explorationId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {

            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ExplorationResponse"];
                };
            };

            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiErrorResponse"];
                };
            };
        };
    };
    getRun: {
        parameters: {
            query?: never;
            header?: never;
            path: {




                explorationId: string;




                runId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {

            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["RunResponse"];
                };
            };

            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiErrorResponse"];
                };
            };
        };
    };
    events: {
        parameters: {
            query?: never;
            header?: {




                "Last-Event-ID"?: string;
            };
            path: {




                explorationId: string;




                runId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {

            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "text/event-stream": components["schemas"]["SseEmitter"];
                };
            };

            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "text/event-stream": components["schemas"]["SseEmitter"];
                };
            };
        };
    };
    deleteReview: {
        parameters: {
            query?: never;
            header?: never;
            path: {




                reviewId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {

            204: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": Record<string, never>;
                };
            };

            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiErrorResponse"];
                };
            };

            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiErrorResponse"];
                };
            };
        };
    };
}
