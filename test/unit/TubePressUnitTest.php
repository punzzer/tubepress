<?php

function_exists('tubepress_load_classes')
    || require dirname(__FILE__) . '/../../sys/classes/tubepress_classloader.php';
tubepress_load_classes(array('org_tubepress_api_options_OptionsManager',
    'org_tubepress_api_ioc_IocService',
    'org_tubepress_impl_options_OptionsReference',
    'org_tubepress_api_message_MessageService',
    'org_tubepress_api_options_StorageManager',
    'org_tubepress_impl_url_YouTubeUrlBuilder',
    'org_tubepress_impl_feed_HTTPRequest2FeedFetcher',
    'org_tubepress_impl_factory_YouTubeVideoFactory',
    'org_tubepress_impl_embedded_YouTubeEmbeddedPlayer',
    'org_tubepress_impl_feed_YouTubeFeedInspector',
    'org_tubepress_api_cache_Cache',
    'org_tubepress_api_pagination_Pagination',
    'org_tubepress_impl_template_SimpleTemplate',
    'org_tubepress_impl_ioc_IocContainer',
    'org_tubepress_impl_filesystem_FsExplorer',
    'org_tubepress_api_theme_ThemeHandler'));

abstract class TubePressUnitTest extends PHPUnit_Framework_TestCase
{
    private $options = array();
    
    protected function initFakeIoc()
    {
        $ioc  = $this->getMock('org_tubepress_api_ioc_IocService');
        $ioc->expects($this->any())
                   ->method('get')
                   ->will($this->returnCallback(array($this, 'getMock')));
        org_tubepress_impl_ioc_IocContainer::setInstance($ioc);
    }
    
    public function getMock($className)
    {
        $mock = parent::getMock($className);
        
        switch ($className) {
            case 'org_tubepress_api_options_OptionsManager':
                $mock->expects($this->any())
                   ->method('get')
                   ->will($this->returnCallback(array($this, 'optionsCallback')));
		        $mock->expects($this->any())
		           ->method('setCustomOptions')
		           ->will($this->returnCallback(array($this, 'setOptions')));
		        $mock->expects($this->any())
		             ->method('getCustomOptions')
		             ->will($this->returnValue($this->options));
                break;
                
            case 'org_tubepress_api_message_MessageService':
            case 'org_tubepress_api_options_StorageManager':
                $mock->expects($this->any())
                   ->method('_')
                   ->will($this->returnCallback(array($this, 'echoCallback')));
                break;
                
            case 'org_tubepress_api_theme_ThemeHandler':
                $mock->expects($this->any())
                     ->method('getTemplateInstance')
                     ->will($this->returnCallback(array($this, 'templateCallback')));
                $mock->expects($this->any())
                     ->method('getCssPath')
                     ->will($this->returnCallback(array($this, 'cssPathCallback')));
                break;
                
            case 'org_tubepress_api_filesystem_Explorer':
                $mock->expects($this->any())
                     ->method('getTubePressBaseInstallationPath')
                     ->will($this->returnValue(realpath(dirname(__FILE__) . '/../../')));
                $mock->expects($this->any())
                     ->method('getFilenamesInDirectory')
                     ->will($this->returnValue(array()));
                $mock->expects($this->any())
                     ->method('getSystemTempDirectory')
                     ->will($this->returnCallback('sys_get_temp_dir'));
                break;
                
            default:
                break;
        }
        return $mock;
    }

    public function cssPathCallback()
    {
        $args = func_get_args();
        if (count($args) === 1 || !$args[1]) {
            return dirname(__FILE__) . '/../../sys/ui/themes/' . $args[0] . '/style.css';
        }
        return 'sys/ui/themes/' . $args[0] . '/style.css';
    }
    
    
    public function templateCallback()
    {
        $template = new org_tubepress_impl_template_SimpleTemplate();
        $args = func_get_args();
        $template->setPath(dirname(__FILE__) . '/../../sys/ui/themes/default/' .$args[0]);
        return $template;
    }
    
    public function setOptions($options)
    {
        $this->options = array();
        foreach ($options as $key => $value) {
            $this->options[$key] = $value;
        }
    }
    
    public function echoCallback()
    {
        $args = func_get_args();
        return $args[0];
    }

    public function optionsCallback() {
        $args = func_get_args();
        
        if (array_key_exists($args[0], $this->options)) {
            return $this->options[$args[0]];
        }
        
        return org_tubepress_impl_options_OptionsReference::getDefaultValue($args[0]);
    }
    
    public static function checkArrayEquality($expected, $actual)
    {
        foreach ($expected as $expectedName) {
            if (!in_array($expectedName, $actual)) {
                throw new Exception("Missing expected array value: $expectedName");
            }
        }
    
        foreach ($actual as $actualName) {
            if (!in_array($actualName, $expected)) {
                throw new Exception("Extra array value: $actualName");
            }
        }
    }
    
    public static function getConstantsForClass($className)
    {
        $ref = new ReflectionClass($className);
        return array_values($ref->getConstants());
    }
}
?>
