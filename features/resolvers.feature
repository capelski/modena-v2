Feature: Requests resolution

    ### Unresolved requests

    Scenario: No resolution for non-matching domain, non-matching query parameters, non-matching pathname request (without default-app)
        Given the app settings contained in the file "basic.json" (inside the apps folder)
        When the request with "non-matching.com" domain, "/non-matching/what-ever" pathname and "$modena=non-matching" query parameters is resolved
        Then no app is matched
        And the request pathname is "/non-matching/what-ever"

    ### Pathname resolution

    Scenario: Pathname resolution for non-matching pathname request
        Given the app settings contained in the file "basic.json" (inside the apps folder)
        When the request with "/non-matching/" pathname is resolved
        Then no app is matched
        And the request pathname is "/non-matching/"

    Scenario: Pathname resolution for matching pathname request
        Given the app settings contained in the file "basic.json" (inside the apps folder)
        When the request with "/app-1/" pathname is resolved
        Then the "app-1" app is matched
        And the request pathname is "/app-1/"

    ### Domain resolution

    Scenario: Domain resolution for non-matching domain request
        Given the app settings contained in the file "basic.json" (inside the apps folder)
        When the request with "non-matching.com" domain and "/" pathname is resolved
        Then no app is matched
        And the request pathname is "/"

    Scenario: Domain resolution for matching domain request
        Given the app settings contained in the file "basic.json" (inside the apps folder)
        When the request with "app-2.com" domain and "/" pathname is resolved
        Then the "app-2" app is matched
        And the request pathname is "/app-2/"

    Scenario: Domain resolution for matching domain with disabled cross-access request
        Given the app settings contained in the file "basic.json" (inside the apps folder)
        When the request with "app-2.com" domain and "/app-1/" pathname is resolved
        Then the "app-2" app is matched
        And the request pathname is "/app-2/app-1/"

    Scenario: Domain resolution for matching domain with enabled cross-access and matching pathname request
        Given the app settings contained in the file "basic.json" (inside the apps folder)
        When the request with "app-3.com" domain and "/app-1/" pathname is resolved
        Then the "app-1" app is matched
        And the request pathname is "/app-1/"

    Scenario: Domain resolution for matching domain with enabled cross-access and non-matching pathname request
        Given the app settings contained in the file "basic.json" (inside the apps folder)
        When the request with "app-3.com" domain and "/non-matching/" pathname is resolved
        Then the "app-3" app is matched
        And the request pathname is "/app-3/non-matching/"

    ### Query string resolution

    Scenario: Query string resolution for non-matching query parameter request
        Given the app settings contained in the file "basic.json" (inside the apps folder)
        When the request with "/" pathname and "$modena=non-matching" query parameters is resolved
        Then no app is matched
        And the request pathname is "/"

    Scenario: Query string resolution for matching query parameter request
        Given the app settings contained in the file "basic.json" (inside the apps folder)
        When the request with "/" pathname and "$modena=app-1" query parameters is resolved
        Then the "app-1" app is matched
        And the request pathname is "/app-1/"

    Scenario: Query string resolution for non-matching query parameter and matching pathname request
        Given the app settings contained in the file "basic.json" (inside the apps folder)
        When the request with "/app-1" pathname and "$modena=non-matching" query parameters is resolved
        Then the "app-1" app is matched
        And the request pathname is "/app-1"

    Scenario: Query string resolution for matching query parameter and matching pathname request
        Given the app settings contained in the file "basic.json" (inside the apps folder)
        When the request with "/app-1" pathname and "$modena=app-2" query parameters is resolved
        Then the "app-2" app is matched
        And the request pathname is "/app-2/app-1"

    Scenario: Query string resolution for matching query parameter, non-matching domain request
        Given the app settings contained in the file "basic.json" (inside the apps folder)
        When the request with "non-matching.com" domain, "/what-ever" pathname and "$modena=app-1" query parameters is resolved
        Then the "app-1" app is matched
        And the request pathname is "/app-1/what-ever"

    Scenario: Query string resolution for matching query parameter and matching domain with disabled cross-access request
        Given the app settings contained in the file "basic.json" (inside the apps folder)
        When the request with "app-2.com" domain, "/what-ever" pathname and "$modena=app-1" query parameters is resolved
        Then the "app-2" app is matched
        And the request pathname is "/app-2/what-ever"

    Scenario: Query string resolution for matching query parameter and matching domain with enabled cross-access request
        Given the app settings contained in the file "basic.json" (inside the apps folder)
        When the request with "app-3.com" domain, "/what-ever" pathname and "$modena=app-1" query parameters is resolved
        Then the "app-1" app is matched
        And the request pathname is "/app-1/what-ever"

    ### Default app resolution

    Scenario: Default app resolution for non-matching pathname request
        Given the app settings contained in the file "default.json" (inside the apps folder)
        When the request with "/non-matching" pathname is resolved
        Then the "default-app" app is matched
        And the request pathname is "/default-app/non-matching"

    Scenario: Default app resolution for matching pathname request
        Given the app settings contained in the file "default.json" (inside the apps folder)
        When the request with "/regular-app" pathname is resolved
        Then the "regular-app" app is matched
        And the request pathname is "/regular-app"

    Scenario: Default app resolution for non-matching domain request
        Given the app settings contained in the file "default.json" (inside the apps folder)
        When the request with "non-matching.com" domain and "/" pathname is resolved
        Then the "default-app" app is matched
        And the request pathname is "/default-app/"

    Scenario: Default app resolution for matching domain request
        Given the app settings contained in the file "default.json" (inside the apps folder)
        When the request with "public-domain.com" domain and "/" pathname is resolved
        Then the "public-domain" app is matched
        And the request pathname is "/public-domain/"

    Scenario: Default app resolution for non-matching query parameter request
        Given the app settings contained in the file "default.json" (inside the apps folder)
        When the request with "/" pathname and "$modena=non-matching" query parameters is resolved
        Then the "default-app" app is matched
        And the request pathname is "/default-app/"

    Scenario: Default app resolution for matching query parameter request
        Given the app settings contained in the file "default.json" (inside the apps folder)
        When the request with "/" pathname and "$modena=regular-app" query parameters is resolved
        Then the "regular-app" app is matched
        And the request pathname is "/regular-app/"
