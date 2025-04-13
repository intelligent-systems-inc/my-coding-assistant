function Form() {
  const [firstName, setFirstName] = useState('Taylor');
  const [lastName, setLastName] = useState('Swift');

  const [fullName, setFullName] = useState('');


  // This effect will run when firstName or lastName changes
  useEffect(() => { 
    console.log('useEffect called');
    setFullName(firstName + ' ' + lastName);
  }, [firstName, lastName]);
} 
