Feature: App discovery

    Scenario Outline: App environment prefix
        Given An app named "<appName>"
        When I get the app environment prefix for the given app
        Then I should get the value "<appPrefix>"
        Examples:
            | appName | appPrefix |
            | myApp   | MYAPP__   |
            | my_app  | MY_APP__  |
            | my-app  | MY_APP__  |

