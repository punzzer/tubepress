<?php

/**
 * A factory class for the dependency injection container.
 * Reads from specifications for components and creates configured instances
 * based upon them.
 * @author Chris Corbyn
 * @package Crafty
 */
class net_sourceforge_phpcrafty_ComponenyFactory
{
  
  /**
   * ComponentSpec collection.
   * @var net_sourceforge_phpcrafty_ComponentSpec[]
   */
  private $_specs = array();
  
  /**
   * ClassLocator collection.
   * @var net_sourceforge_phpcrafty_ClassLocator[]
   */
  private $_classLocators = array();
  
  /**
   * ComponentSpecFinder collection.
   * @var net_sourceforge_phpcrafty_ComponentSpecFinder[]
   */
  private $_specFinders = array();
  
  /**
   * Shared component instances
   * @var mixed[]
   */
  private $_sharedInstances = array();
  
  /**
   * Creates a new instance of the ComponentSpec class.
   * @return net_sourceforge_phpcrafty_ComponentSpec
   */
  public function newComponentSpec($className = null, $constructorArgs = array(),
    $properties = array(), $shared = false)
  {
    return new net_sourceforge_phpcrafty_ComponentSpec($className, $constructorArgs, $properties,
      $shared);
  }
  
  /**
   * Creates a new ComponentReference for the given $componentName.
   * @param string $componentName
   * @return net_sourceforge_phpcrafty_ComponentReference
   */
  public function referenceFor($componentName)
  {
    return new net_sourceforge_phpcrafty_ComponentReference($componentName);
  }
  
  /**
   * Create a new ComponentReflector for the given class with the given
   * properties.
   * @param string $className
   * @param mixed[] $properties
   * @return net_sourceforge_phpcrafty_ComponentReflector
   * @access private
   */
  private function _newComponentReflector($className, $properties)
  {
    return new net_sourceforge_phpcrafty_ComponentReflector($className, $properties);
  }
  
  /**
   * Sets the specification for the given $componentName.
   * @param string $componentName
   * @param net_sourceforge_phpcrafty_ComponentSpec The specification for $componentName
   */
  public function setComponentSpec($componentName, net_sourceforge_phpcrafty_ComponentSpec $spec)
  {
    $this->_specs[$componentName] = $spec;
  }
  
  /**
   * Gets the specification for the given $componentName.
   * @param string $componentName
   * @return net_sourceforge_phpcrafty_ComponentSpec
   * @throws net_sourceforge_phpcrafty_ComponenyFactoryException If spec is not found
   */
  public function getComponentSpec($componentName)
  {
    if (!isset($this->_specs[$componentName]))
    {
      $spec = null;
      
      foreach ($this->_specFinders as $finder)
      {
        if ($spec = $finder->findSpecFor($componentName, $this))
        {
          $this->_specs[$componentName] = $spec;
          break;
        }
      }
      
      if (!$spec)
      {
        throw new net_sourceforge_phpcrafty_ComponenyFactoryException(
          $componentName . ' does not exist');
      }
    }
    
    return $this->_specs[$componentName];
  }
  
  /**
   * Register a new ClassLocator for finding and loading class files.
   * @param string $key
   * @param net_sourceforge_phpcrafty_ClassLocator The ClassLocator to register
   */
  public function registerClassLocator($key, net_sourceforge_phpcrafty_ClassLocator $locator)
  {
    $this->_classLocators[$key] = $locator;
  }
  
  /**
   * Registers a new ComponentSpec finder in this factory.
   * @param string $key
   * @param net_sourceforge_phpcrafty_ComponentSpecFinder The spec finder instance
   */
  public function registerSpecFinder($key, net_sourceforge_phpcrafty_ComponentSpecFinder $finder)
  {
    $this->_specFinders[$key] = $finder;
  }
  
  /**
   * Test if the given parameter is a dependency to be resolved.
   * @param mixed $input
   * @return boolean
   * @access private
   */
  private function _isDependency($input)
  {
    return ($input instanceof net_sourceforge_phpcrafty_ComponentReference);
  }
  
  /**
   * Resolve all dependencies from ComponentReference objects into their
   * appropriate instances.
   * @param mixed $input
   * @return mixed
   * @access private
   */
  private function _resolveDependencies($input)
  {
    if (is_array($input))
    {
      $ret = array();
      foreach ($input as $value)
      {
        $ret[] = $this->_resolveDependencies($value);
      }
      return $ret;
    }
    else
    {
      if ($this->_isDependency($input))
      {
        $componentName = $input->getComponentName();
        return $this->create($componentName);
      }
      else
      {
        return $input;
      }
    }
  }
  
  /**
   * Get a ReflectionClass decorated to provide setter-based injection
   * components during instantiation.
   * @param string $componentName
   * @return net_sourceforge_phpcrafty_ComponentReflector
   */
  public function classOf($componentName)
  {
    $spec = $this->getComponentSpec($componentName);
    
    $className = $spec->getClassName();
    
    //Load the class file
    foreach ($this->_classLocators as $locator)
    {
      if ($locator->classExists($className))
      {
        $locator->includeClass($className);
        break;
      }
    }
    
    //Apply properties
    $properties = array();
    
    foreach ($spec->getProperties() as $key => $value)
    {
      $properties[$key] = $this->_resolveDependencies($value);
    }
    
    $class = $this->_newComponentReflector($className, $properties);
    
    return $class;
  }
  
  /**
   * Create an instance of the given component.
   * @param string $componentName
   * @param mixed[] $constructorArgs, optional
   * @return object
   */
  public function create($componentName, $constructorArgs = null)
  {
    $spec = $this->getComponentSpec($componentName);
    
    //If shared instances are used, try to return a registered instance
    // if not, reference it now
    if ($spec->isShared())
    {
      if (isset($this->_sharedInstances[$componentName]))
      {
        return $this->_sharedInstances[$componentName];
      }
      else
      {
        $o = null;
        $this->_sharedInstances[$componentName] =& $o;
      }
    }
    
    //Get the Reflector
    $class = $this->classOf($componentName);
    
    //Determine constructor params
    if (!is_array($constructorArgs))
    {
      $injectedArgs = $this->_resolveDependencies(
        $spec->getConstructorArgs());
    }
    else
    {
      $injectedArgs = $this->_resolveDependencies($constructorArgs);
    }
     
    $o = $class->newInstanceArgs($injectedArgs);
    
    return $o;
  }
  
}